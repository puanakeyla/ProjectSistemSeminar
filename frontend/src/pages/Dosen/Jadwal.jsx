import { useEffect, useMemo, useState } from 'react';
import { dosenAPI } from '../../services/api';
import './Jadwal.css';
import { Calendar, Clock, MapPin, RefreshCw, AlertCircle, User } from 'lucide-react';

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
      <div className="dosen-schedule-page">
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <h2>Memuat jadwal dosen...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dosen-schedule-page">
      <div className="schedule-header">
        <div>
          <h1>Jadwal Seminar Anda</h1>
          <p>Daftar seminar tempat Anda terdaftar sebagai pembimbing atau penguji</p>
        </div>
        <button className="refresh-btn" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'spinning' : ''}`} />
          {refreshing ? 'Menyegarkan...' : 'Segarkan'}
        </button>
      </div>

      <div className="filter-row">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            className={`filter-chip ${filter === option.id ? 'active' : ''}`}
            onClick={() => setFilter(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="alert error">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {filteredSchedules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>
            {filter === 'upcoming'
              ? 'Belum ada jadwal mendatang'
              : filter === 'today'
              ? 'Tidak ada jadwal hari ini'
              : 'Tidak ada data untuk filter ini'}
          </h2>
          <p>
            {filter === 'all'
              ? 'Belum ada penjadwalan untuk seminar Anda.'
              : 'Coba pilih filter lain atau segarkan data.'}
          </p>
        </div>
      ) : (
        <div className="schedule-grid">
          {filteredSchedules.map((seminar) => {
            const schedule = seminar.schedule;
            return (
              <div key={seminar.id} className="schedule-card">
                <div className="card-top">
                  <div>
                    <p className="seminar-type">{seminar.jenis_seminar}</p>
                    <h3>{seminar.judul}</h3>
                  </div>
                  <span className={`status-pill status-${seminar.status_color}`}>
                    {seminar.status_display}
                  </span>
                </div>

                <div className="student-info">
                  <User className="w-4 h-4" />
                  <div>
                    <p className="student-name">{seminar.mahasiswa_name}</p>
                    <p className="student-npm">{seminar.mahasiswa_npm}</p>
                  </div>
                </div>

                <div className="schedule-details">
                  <div className="detail-item">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateLabel(schedule)}</span>
                  </div>
                  <div className="detail-item">
                    <Clock className="w-4 h-4" />
                    <span>{schedule?.tanggal_jam?.split('·')?.pop()?.trim() || schedule?.tanggal_jam || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <MapPin className="w-4 h-4" />
                    <span>{schedule?.ruangan || 'Belum ditentukan'}</span>
                  </div>
                </div>

                <div className="card-footer">
                  <span className="role-tag">Peran Anda: {seminar.user_role}</span>
                  {!schedule && (
                    <span className="pending-label">Menunggu jadwal dari admin</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DosenJadwal;
