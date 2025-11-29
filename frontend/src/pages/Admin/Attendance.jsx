import { useState, useEffect } from 'react';
import './Attendance.css';
import { adminAPI } from '../../services/api';

function Attendance() {
  const [attendances, setAttendances] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    seminar_schedule_id: '',
    mahasiswa_id: '',
    metode: 'manual'
  });

  // Normalize various API response shapes into an array
  const normalizeArray = (val) => {
    if (Array.isArray(val)) return val;
    if (!val) return [];
    if (Array.isArray(val.data)) return val.data;
    if (Array.isArray(val.attendances)) return val.attendances;
    // fallback: find first array value in the object
    const maybeArray = Object.values(val).find(v => Array.isArray(v));
    return Array.isArray(maybeArray) ? maybeArray : [];
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attendancesData, schedulesData, mahasiswaData] = await Promise.all([
        adminAPI.getAttendances(),
        adminAPI.getSchedules(),
        adminAPI.getMahasiswaList()
      ]);
      setAttendances(normalizeArray(attendancesData));
      setSchedules(normalizeArray(schedulesData).filter(s => s.status === 'scheduled' || s.status === 'completed'));
      setMahasiswaList(normalizeArray(mahasiswaData));
    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewScheduleAttendance = async (schedule) => {
    try {
      setSelectedSchedule(schedule);
      const data = await adminAPI.getScheduleAttendances(schedule.id);
      setAttendances(normalizeArray(data));
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal memuat data absensi');
    }
  };

  const handleAddManual = () => {
    setFormData({
      seminar_schedule_id: '',
      mahasiswa_id: '',
      metode: 'manual'
    });
    setShowManualModal(true);
  };

  const handleSubmitManual = async (e) => {
    e.preventDefault();

    try {
      await adminAPI.manualAttendance(formData);
      alert('Absensi manual berhasil ditambahkan');
      setShowManualModal(false);
      await fetchData();

      if (selectedSchedule) {
        await handleViewScheduleAttendance(selectedSchedule);
      }
    } catch (err) {
      console.error('Error:', err);
      alert(err.response?.data?.message || 'Gagal menambahkan absensi');
    }
  };

  const handleDelete = async (attendanceId) => {
    if (!window.confirm('Hapus data absensi ini?')) return;

    try {
      await adminAPI.deleteAttendance(attendanceId);
      alert('Absensi berhasil dihapus');
      await fetchData();

      if (selectedSchedule) {
        await handleViewScheduleAttendance(selectedSchedule);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal menghapus absensi');
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

  const getMethodBadge = (method) => {
    return method === 'qr_scan'
      ? { label: '📱 QR Scan', class: 'qr-scan' }
      : { label: '✍️ Manual', class: 'manual' };
  };

  const getStatusBadge = (status) => {
    const badges = {
      hadir: { label: '✅ Hadir', class: 'hadir' },
      izin: { label: '📝 Izin', class: 'izin' },
      sakit: { label: '🏥 Sakit', class: 'sakit' },
      alpha: { label: '❌ Alpha', class: 'alpha' }
    };
    return badges[status] || badges.hadir;
  };

  if (loading) {
    return (
      <div className="admin-attendance">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Memuat data absensi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-attendance">
      {/* Header */}
      <div className="attendance-header">
        <div className="header-content">
          <h1>Absensi Seminar</h1>
          <p>Kelola dan lihat data kehadiran seminar</p>
        </div>
        <div className="header-actions">
          <button className="btn-manual" onClick={handleAddManual}>
            ✍️ Absensi Manual
          </button>
          <button className="refresh-btn" onClick={fetchData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="attendance-layout">
        {/* Schedules List */}
        <div className="schedules-panel">
          <div className="panel-header">
            <h2>Jadwal Seminar</h2>
            <span className="count-badge">{schedules.length}</span>
          </div>

          {schedules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <p>Tidak ada jadwal</p>
            </div>
          ) : (
            <div className="schedules-list">
              {schedules.map((schedule) => {
                const attendanceCount = attendances.filter(a => a.seminar_schedule_id === schedule.id).length;

                return (
                  <div
                    key={schedule.id}
                    className={`schedule-card ${selectedSchedule?.id === schedule.id ? 'selected' : ''}`}
                    onClick={() => handleViewScheduleAttendance(schedule)}
                  >
                    <h3>{schedule.seminar?.judul}</h3>
                    <div className="card-info">
                      <div className="info-row">
                        <span className="label">Mahasiswa:</span>
                        <span className="value">{schedule.seminar?.mahasiswa?.name}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Waktu:</span>
                        <span className="value">{formatDate(schedule.waktu_mulai)}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Ruang:</span>
                        <span className="value">{schedule.ruang}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Kehadiran:</span>
                        <span className="value attendance-count">{attendanceCount} peserta</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attendance Table */}
        <div className="attendance-panel">
          <div className="panel-header">
            <h2>
              {selectedSchedule
                ? `Absensi: ${selectedSchedule.seminar?.judul}`
                : 'Semua Absensi'}
            </h2>
            <span className="count-badge">{attendances.length}</span>
          </div>

          {attendances.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>Tidak Ada Data</h3>
              <p>{selectedSchedule ? 'Belum ada yang absen untuk seminar ini' : 'Pilih jadwal untuk melihat absensi'}</p>
            </div>
          ) : (
            <div className="attendance-table">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Mahasiswa</th>
                    <th>NPM</th>
                    <th>Seminar</th>
                    <th>Waktu Scan</th>
                    <th>Metode</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {attendances.map((attendance, index) => {
                    const methodBadge = getMethodBadge(attendance.metode);
                    const statusBadge = getStatusBadge(attendance.status);

                    return (
                      <tr key={attendance.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{attendance.mahasiswa?.name || '-'}</strong>
                        </td>
                        <td>{attendance.mahasiswa?.npm || '-'}</td>
                        <td className="seminar-cell">
                          {attendance.schedule?.seminar?.judul || '-'}
                        </td>
                        <td>{formatDate(attendance.waktu_scan)}</td>
                        <td>
                          <span className={`method-badge ${methodBadge.class}`}>
                            {methodBadge.label}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${statusBadge.class}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-delete"
                            onClick={() => handleDelete(attendance.id)}
                            title="Hapus"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tambah Absensi Manual</h2>
              <button className="close-btn" onClick={() => setShowManualModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmitManual} className="modal-body">
              <div className="form-group">
                <label>Jadwal Seminar *</label>
                <select
                  value={formData.seminar_schedule_id}
                  onChange={(e) => setFormData({...formData, seminar_schedule_id: e.target.value})}
                  required
                >
                  <option value="">Pilih Jadwal</option>
                  {schedules.map(schedule => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.seminar?.judul} - {formatDate(schedule.waktu_mulai)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Mahasiswa *</label>
                <select
                  value={formData.mahasiswa_id}
                  onChange={(e) => setFormData({...formData, mahasiswa_id: e.target.value})}
                  required
                >
                  <option value="">Pilih Mahasiswa</option>
                  {mahasiswaList.map(mhs => (
                    <option key={mhs.id} value={mhs.id}>
                      {mhs.name} ({mhs.npm})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowManualModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-primary">
                  ✓ Simpan Absensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance;
