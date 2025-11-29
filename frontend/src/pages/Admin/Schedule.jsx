import { useState, useEffect } from 'react';
import './Schedule.css';
import { adminAPI } from '../../services/api';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import { FileText } from 'lucide-react';

function Schedule() {
  const [schedules, setSchedules] = useState([]);
  const [availableSeminars, setAvailableSeminars] = useState([]);
  const [selectedSeminar, setSelectedSeminar] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [commonDates, setCommonDates] = useState([]);
  
  const [formData, setFormData] = useState({
    seminar_id: '',
    tanggal: '',
    waktu_mulai: '',
    durasi_menit: 120,
    ruang: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesData, seminarsData] = await Promise.all([
        adminAPI.getSchedules(),
        adminAPI.getAvailableSeminars()
      ]);
      setSchedules(schedulesData);
      setAvailableSeminars(seminarsData);
    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const calculateCommonDates = (seminar) => {
    if (!seminar.approvals || seminar.approvals.length < 3) {
      return [];
    }

    // Get available dates from all 3 dosen
    const approvals = seminar.approvals;
    const dates1 = approvals[0]?.available_dates || [];
    const dates2 = approvals[1]?.available_dates || [];
    const dates3 = approvals[2]?.available_dates || [];

    if (dates1.length === 0 || dates2.length === 0 || dates3.length === 0) {
      return [];
    }

    // Find intersection of all three date arrays
    const common = dates1.filter(date1 => 
      dates2.includes(date1) && dates3.includes(date1)
    );

    // Sort dates
    return common.sort((a, b) => new Date(a) - new Date(b));
  };

  const handleSelectSeminar = (seminar) => {
    setSelectedSeminar(seminar);
    const dates = calculateCommonDates(seminar);
    setCommonDates(dates);
    setFormData({
      seminar_id: seminar.id,
      tanggal: '',
      waktu_mulai: '',
      durasi_menit: 120,
      ruang: ''
    });
    setShowCreateModal(true);
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    
    if (!formData.tanggal || !formData.waktu_mulai || !formData.ruang) {
      alert('Semua field harus diisi!');
      return;
    }

    try {
      setCreateLoading(true);
      
      // Combine date and time
      const waktuMulai = `${formData.tanggal} ${formData.waktu_mulai}:00`;
      
      await adminAPI.createSchedule({
        seminar_id: formData.seminar_id,
        waktu_mulai: waktuMulai,
        durasi_menit: parseInt(formData.durasi_menit),
        ruang: formData.ruang,
        status: 'scheduled'
      });

      alert('Jadwal berhasil dibuat!');
      setShowCreateModal(false);
      setSelectedSeminar(null);
      setFormData({
        seminar_id: '',
        tanggal: '',
        waktu_mulai: '',
        durasi_menit: 120,
        ruang: ''
      });
      
      await fetchData();
    } catch (err) {
      console.error('Error creating schedule:', err);
      alert(err.response?.data?.message || 'Gagal membuat jadwal');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      return;
    }

    try {
      await adminAPI.deleteSchedule(scheduleId);
      alert('Jadwal berhasil dihapus');
      await fetchData();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert('Gagal menghapus jadwal');
    }
  };

  const handleUpdateStatus = async (scheduleId, newStatus) => {
    try {
      await adminAPI.updateSchedule(scheduleId, { status: newStatus });
      alert('Status berhasil diupdate');
      await fetchData();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Gagal mengupdate status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { icon: <Calendar className="w-5 h-5" />, label: 'Scheduled', class: 'scheduled' },
      completed: { icon: <CheckCircle className="w-5 h-5" />, label: 'Completed', class: 'completed' },
      cancelled: { icon: <XCircle className="w-5 h-5" />, label: 'Cancelled', class: 'cancelled' }
    };
    return badges[status] || badges.scheduled;
  };

  if (loading) {
    return (
      <div className="admin-schedule">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Memuat data penjadwalan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-schedule">
      {/* Header */}
      <div className="schedule-header">
        <div className="header-content">
          <h1>Penjadwalan Seminar</h1>
          <p>Kelola jadwal seminar berdasarkan ketersediaan dosen</p>
        </div>
        <button className="refresh-btn" onClick={fetchData}>
          <span>🔄</span> Refresh
        </button>
      </div>

      {/* Available Seminars */}
      <div className="available-seminars-section">
        <div className="section-header">
          <h2>Seminar Siap Dijadwalkan</h2>
          <span className="count-badge">{availableSeminars.length}</span>
        </div>

        {availableSeminars.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FileText className="w-8 h-8" /></div>
            <h3>Tidak Ada Seminar</h3>
            <p>Semua seminar yang sudah diverifikasi telah dijadwalkan</p>
          </div>
        ) : (
          <div className="seminars-grid">
            {availableSeminars.map((seminar) => {
              const commonDatesCount = calculateCommonDates(seminar).length;
              return (
                <div key={seminar.id} className="seminar-card">
                  <div className="card-header">
                    <span className={`type-badge ${seminar.tipe}`}>
                      {seminar.tipe === 'proposal' ? '📋' : '📘'} {seminar.tipe}
                    </span>
                    <span className={`dates-badge ${commonDatesCount > 0 ? 'available' : 'unavailable'}`}>
                      {commonDatesCount} tanggal tersedia
                    </span>
                  </div>
                  
                  <h3>{seminar.judul}</h3>
                  
                  <div className="card-info">
                    <div className="info-row">
                      <span className="label">Mahasiswa:</span>
                      <span className="value">{seminar.mahasiswa?.name}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">NPM:</span>
                      <span className="value">{seminar.mahasiswa?.npm}</span>
                    </div>
                  </div>

                  <div className="dosen-list">
                    <label>Tim Penguji:</label>
                    {seminar.approvals?.map((approval, idx) => (
                      <div key={idx} className="dosen-item">
                        <span className="role">{approval.peran}:</span>
                        <span className="name">{approval.dosen?.name}</span>
                        <span className="dates-count">
                          ({approval.available_dates?.length || 0} tanggal)
                        </span>
                      </div>
                    ))}
                  </div>

                  <button 
                    className="schedule-btn"
                    onClick={() => handleSelectSeminar(seminar)}
                    disabled={commonDatesCount === 0}
                  >
                    {commonDatesCount === 0 ? '⚠️ Tidak Ada Tanggal Cocok' : '📅 Buat Jadwal'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scheduled Seminars */}
      <div className="scheduled-section">
        <div className="section-header">
          <h2>Jadwal Terkonfirmasi</h2>
          <span className="count-badge">{schedules.length}</span>
        </div>

        {schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Calendar className="w-8 h-8" /></div>
            <h3>Belum Ada Jadwal</h3>
            <p>Jadwal yang dibuat akan muncul di sini</p>
          </div>
        ) : (
          <div className="schedules-table">
            <table>
              <thead>
                <tr>
                  <th>Mahasiswa</th>
                  <th>Judul Seminar</th>
                  <th>Tipe</th>
                  <th>Waktu</th>
                  <th>Durasi</th>
                  <th>Ruang</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => {
                  const badge = getStatusBadge(schedule.status);
                  return (
                    <tr key={schedule.id}>
                      <td>
                        <div className="mahasiswa-info">
                          <strong>{schedule.seminar?.mahasiswa?.name}</strong>
                          <span>{schedule.seminar?.mahasiswa?.npm}</span>
                        </div>
                      </td>
                      <td className="seminar-title">{schedule.seminar?.judul}</td>
                      <td>
                        <span className={`type-badge ${schedule.seminar?.tipe}`}>
                          {schedule.seminar?.tipe === 'proposal' ? '📋' : '📘'}
                        </span>
                      </td>
                      <td>{formatDate(schedule.waktu_mulai)}</td>
                      <td>{schedule.durasi_menit} menit</td>
                      <td>
                        <span className="room-badge">{schedule.ruang}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${badge.class}`}>
                          {badge.icon} {badge.label}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {schedule.status === 'scheduled' && (
                            <>
                              <button 
                                className="btn-complete"
                                onClick={() => handleUpdateStatus(schedule.id, 'completed')}
                                title="Tandai Selesai"
                              >
                                ✅
                              </button>
                              <button 
                                className="btn-cancel"
                                onClick={() => handleUpdateStatus(schedule.id, 'cancelled')}
                                title="Batalkan"
                              >
                                ❌
                              </button>
                            </>
                          )}
                          <button 
                            className="btn-delete"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            title="Hapus"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Schedule Modal */}
      {showCreateModal && selectedSeminar && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Buat Jadwal Seminar</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Seminar Info */}
              <div className="seminar-info-box">
                <h3>{selectedSeminar.judul}</h3>
                <p>Mahasiswa: {selectedSeminar.mahasiswa?.name} ({selectedSeminar.mahasiswa?.npm})</p>
                <p>Tipe: <span className={`type-badge ${selectedSeminar.tipe}`}>{selectedSeminar.tipe}</span></p>
              </div>

              {/* Common Dates */}
              <div className="common-dates-section">
                <h4>Tanggal Ketersediaan Bersama ({commonDates.length} tanggal)</h4>
                {commonDates.length === 0 ? (
                  <div className="no-common-dates">
                    <p>⚠️ Tidak ada tanggal yang cocok untuk semua dosen</p>
                  </div>
                ) : (
                  <div className="dates-grid">
                    {commonDates.map((date, idx) => (
                      <label key={idx} className="date-option">
                        <input
                          type="radio"
                          name="tanggal"
                          value={date}
                          checked={formData.tanggal === date}
                          onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                        />
                        <span className="date-label">
                          <span className="date-icon">📅</span>
                          {formatDateOnly(date)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleCreateSchedule}>
                <div className="form-group">
                  <label>Waktu Mulai *</label>
                  <input
                    type="time"
                    value={formData.waktu_mulai}
                    onChange={(e) => setFormData({...formData, waktu_mulai: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Durasi (menit) *</label>
                  <select
                    value={formData.durasi_menit}
                    onChange={(e) => setFormData({...formData, durasi_menit: e.target.value})}
                    required
                  >
                    <option value="60">60 menit</option>
                    <option value="90">90 menit</option>
                    <option value="120">120 menit</option>
                    <option value="150">150 menit</option>
                    <option value="180">180 menit</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Ruangan *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ruang Seminar Lt.3"
                    value={formData.ruang}
                    onChange={(e) => setFormData({...formData, ruang: e.target.value})}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={createLoading || !formData.tanggal}
                  >
                    {createLoading ? 'Membuat...' : '✓ Buat Jadwal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Schedule;
