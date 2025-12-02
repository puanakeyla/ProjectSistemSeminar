import { useEffect, useMemo, useState } from 'react';
import { dosenAPI } from '../../services/api';
import './Jadwal.css?v=2'; // Force reload CSS
import { Calendar, Clock, MapPin, RefreshCw, AlertCircle, User, CalendarDays, Loader2, XCircle, GraduationCap, FileText } from 'lucide-react';

const FILTERS = [
  { id: 'upcoming', label: 'Mendatang' },
  { id: 'today', label: 'Hari Ini' },
  { id: 'past', label: 'Riwayat' },
  { id: 'all', label: 'Semua' },
];

function formatDateLabel(schedule) {
  if (!schedule?.tanggal_jam) {
    return 'Menunggu penjadwalan';
  }
  if (schedule.is_today) {
    return `Hari ini · ${schedule.tanggal_jam}`;
  }
  if (schedule.is_upcoming) {
    return `Akan datang · ${schedule.tanggal_jam}`;
  }
  if (schedule.is_past) {
    return `Selesai · ${schedule.tanggal_jam}`;
  }
  return schedule.tanggal_jam;
}

function DosenJadwal() {
  const [seminars, setSeminars] = useState([]);
  const [filter, setFilter] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [cancelModal, setCancelModal] = useState({ show: false, seminar: null });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dosenAPI.getMySeminars('all');
      setSeminars(response.data || []);
    } catch (err) {
      console.error('Failed to fetch dosen schedules:', err);
      const message = err.response?.data?.message || 'Gagal memuat jadwal dosen.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSchedules();
  };

  const handleCancelClick = (seminar) => {
    setCancelModal({ show: true, seminar });
    setCancelReason('');
  };

  const handleCancelConfirm = async () => {
    if (!cancelReason.trim()) {
      alert('Harap masukkan alasan pembatalan');
      return;
    }

    try {
      setCancelling(true);
      await dosenAPI.cancelSeminar(cancelModal.seminar.id, {
        cancel_reason: cancelReason
      });
      
      alert('Seminar berhasil dibatalkan. Mahasiswa akan menerima notifikasi.');
      setCancelModal({ show: false, seminar: null });
      setCancelReason('');
      loadSchedules(); // Refresh data
    } catch (err) {
      console.error('Failed to cancel seminar:', err);
      const message = err.response?.data?.message || 'Gagal membatalkan seminar';
      alert(message);
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelClose = () => {
    setCancelModal({ show: false, seminar: null });
    setCancelReason('');
  };

  const filteredSchedules = useMemo(() => {
    const sorted = [...seminars].sort((a, b) => {
      const dateA = a.schedule?.waktu_mulai_iso ? new Date(a.schedule.waktu_mulai_iso).getTime() : Infinity;
      const dateB = b.schedule?.waktu_mulai_iso ? new Date(b.schedule.waktu_mulai_iso).getTime() : Infinity;
      return dateA - dateB;
    });

    return sorted.filter((seminar) => {
      if (!seminar.schedule) {
        return filter === 'all';
      }

      if (filter === 'today') {
        return seminar.schedule.is_today;
      }

      if (filter === 'upcoming') {
        return seminar.schedule.is_upcoming && !seminar.schedule.is_today;
      }

      if (filter === 'past') {
        return seminar.schedule.is_past;
      }

      return true; // filter === 'all'
    });
  }, [seminars, filter]);

  if (loading) {
    return (
      <div className="jadwal-page">
        <div className="jadwal-card">
          <div className="jadwal-state">
            <div className="jadwal-state-icon">
              <Loader2 size={32} className="icon-spin" />
            </div>
            <h2>Memuat jadwal dosen...</h2>
            <p>Harap tunggu sebentar.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="jadwal-page">
      <div className="jadwal-card">
        <div className="jadwal-hero">
          <div className="jadwal-hero-text">
            <div className="jadwal-hero-title">
              <div className="jadwal-hero-icon">
                <CalendarDays size={24} />
              </div>
              <div>
                <p className="jadwal-hero-subtitle">Daftar seminar tempat Anda terdaftar sebagai pembimbing atau penguji</p>
                <h1>Jadwal Seminar Anda</h1>
              </div>
            </div>
          </div>
          <button className="jadwal-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Menyegarkan...' : 'Segarkan'}
          </button>
        </div>

        <div className="jadwal-section">
          <div className="jadwal-filter">
            {FILTERS.map((option) => (
              <button
                key={option.id}
                className={`jadwal-filter-btn ${filter === option.id ? 'active' : ''}`}
                onClick={() => setFilter(option.id)}
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="jadwal-alert error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {filteredSchedules.length === 0 ? (
            <div className="jadwal-empty">
              <div className="jadwal-empty-icon">
                <Calendar size={32} />
              </div>
              <h3>
                {filter === 'upcoming'
                  ? 'Belum ada jadwal mendatang'
                  : filter === 'today'
                  ? 'Tidak ada jadwal hari ini'
                  : 'Tidak ada data untuk filter ini'}
              </h3>
              <p>
                {filter === 'all'
                  ? 'Belum ada penjadwalan untuk seminar Anda.'
                  : 'Coba pilih filter lain atau segarkan data.'}
              </p>
            </div>
          ) : (
            <div className="jadwal-grid">
            {filteredSchedules.map((seminar) => {
              const schedule = seminar.schedule;
              return (
                <div key={seminar.id} className="jadwal-item">
                  <div className="jadwal-item-header">
                    <div className="seminar-info">
                      <span className="seminar-type-badge">{seminar.jenis_seminar}</span>
                      <h3 className="jadwal-title">{seminar.judul}</h3>
                    </div>
                    <span className={`status-badge status-${seminar.status_color}`}>
                      {seminar.status_display}
                    </span>
                  </div>

                  <div className="student-row">
                    <div className="student-avatar">
                      {seminar.mahasiswa_name.charAt(0)}
                    </div>
                    <div className="student-details">
                      <p className="student-name">{seminar.mahasiswa_name}</p>
                      <p className="student-npm">{seminar.mahasiswa_npm}</p>
                    </div>
                  </div>

                  <div className="jadwal-details">
                    <div className="jadwal-detail-item">
                      <span className="detail-icon">
                        <Calendar size={14} />
                      </span>
                      <span>{formatDateLabel(schedule)}</span>
                    </div>
                    <div className="jadwal-detail-item">
                      <span className="detail-icon">
                        <Clock size={14} />
                      </span>
                      <span>{schedule?.tanggal_jam?.split('·')?.pop()?.trim() || schedule?.tanggal_jam || '-'}</span>
                    </div>
                    <div className="jadwal-detail-item">
                      <span className="detail-icon">
                        <MapPin size={14} />
                      </span>
                      <span>{schedule?.ruangan || 'Belum ditentukan'}</span>
                    </div>
                  </div>

                  <div className="jadwal-footer">
                    <span className="role-label">Peran Anda: <strong>{seminar.user_role}</strong></span>
                    {!schedule ? (
                      <span className="pending-text">Menunggu jadwal dari admin</span>
                    ) : (
                      schedule.is_upcoming && (
                        <button 
                          className="cancel-seminar-btn"
                          onClick={() => handleCancelClick(seminar)}
                          title="Batalkan Seminar"
                        >
                          <XCircle size={16} />
                          Batalkan
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelModal.show && (
        <div className="modal-overlay" onClick={handleCancelClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-warning">
                <XCircle size={32} />
              </div>
              <h2>Batalkan Seminar</h2>
              <p className="modal-warning-text">
                Perhatian: Membatalkan seminar akan membatalkan seluruh jadwal dan mahasiswa akan menerima notifikasi.
              </p>
            </div>

            <div className="modal-body">
              <div className="seminar-info-box">
                <div>
                  <p className="info-label">
                    <GraduationCap size={14} />
                    Mahasiswa
                  </p>
                  <p className="info-value">{cancelModal.seminar?.mahasiswa_name}</p>
                </div>
                <div>
                  <p className="info-label">
                    <FileText size={14} />
                    Judul Seminar
                  </p>
                  <p className="info-value">{cancelModal.seminar?.judul}</p>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cancel-reason">
                  Alasan Pembatalan <span className="required">*</span>
                </label>
                <textarea
                  id="cancel-reason"
                  className="form-textarea"
                  rows="4"
                  placeholder="Jelaskan alasan pembatalan seminar..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  disabled={cancelling}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={handleCancelClose}
                disabled={cancelling}
              >
                Batal
              </button>
              <button
                className="btn-danger"
                onClick={handleCancelConfirm}
                disabled={cancelling || !cancelReason.trim()}
              >
                {cancelling ? (
                  <>
                    <Loader2 size={16} className="icon-spin" />
                    Membatalkan...
                  </>
                ) : (
                  <>
                    <XCircle size={16} />
                    Batalkan Seminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DosenJadwal;
