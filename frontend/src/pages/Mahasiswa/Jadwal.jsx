import { useState, useEffect } from 'react';
import axios from 'axios';
import './Jadwal.css';
import { Clock, AlertTriangle, Calendar, MapPin, User, CheckCircle, Loader2 } from 'lucide-react'

const API_URL = 'http://localhost:8000/api';

function Jadwal() {
  const [jadwalList, setJadwalList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJadwal();
  }, []);

  const fetchJadwal = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/mahasiswa/attendance/schedules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJadwalList(response.data.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching jadwal:', err);
      setError('Gagal memuat jadwal seminar');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="jadwal-wrapper">
        <div className="loading-state">
          <div className="loading-icon">
            <Loader2 size={32} className="icon-spin" />
          </div>
          <h2>Memuat data...</h2>
          <p>Harap tunggu sebentar.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="jadwal-wrapper">
        <div className="jadwal-empty-state">
          <div className="jadwal-empty-icon" style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626' }}>
            <AlertTriangle size={32} />
          </div>
          <h2>Terjadi Kesalahan</h2>
          <p style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</p>
          <button onClick={fetchJadwal} style={{ padding: '12px 24px', background: '#4E8EA2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="jadwal-wrapper">
      <div className="jadwal-header">
        <h1>Jadwal Seminar</h1>
        <p>Daftar jadwal seminar yang telah dijadwalkan</p>
      </div>

      <div className="jadwal-content">
        {jadwalList.length === 0 ? (
          <div className="jadwal-empty-state">
            <div className="jadwal-empty-icon">
              <Calendar size={32} />
            </div>
            <h2>Belum Ada Jadwal</h2>
            <p>Jadwal seminar akan muncul setelah admin menjadwalkan</p>
          </div>
        ) : (
          <div className="jadwal-grid">
            {jadwalList.map((jadwal) => (
              <div key={jadwal.id} className="jadwal-card">
                <div className="jadwal-card-header">
                  {jadwal.jenis_seminar && jadwal.jenis_seminar !== '-' && (
                    <span className="jenis-badge">{jadwal.jenis_seminar}</span>
                  )}
                  <h3>{jadwal.mahasiswa_name}</h3>
                  <span className="npm-badge">{jadwal.mahasiswa_npm}</span>
                </div>

                <div className="jadwal-card-body">
                  <h4 className="judul-seminar">{jadwal.judul}</h4>

                  <div className="jadwal-info">
                    <div className="info-item">
                      <span className="icon"><Calendar className="w-5 h-5" /></span>
                      <div>
                        <span className="label">Tanggal</span>
                        <span className="value">{jadwal.tanggal_display}</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <span className="icon"><Clock className="w-5 h-5" /></span>
                      <div>
                        <span className="label">Waktu</span>
                        <span className="value">{jadwal.waktu_display}</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <span className="icon"><MapPin className="w-5 h-5" /></span>
                      <div>
                        <span className="label">Ruangan</span>
                        <span className="value">{jadwal.ruangan}</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <span className="icon"><User className="w-5 h-5" /></span>
                      <div>
                        <span className="label">Pembimbing</span>
                        <span className="value">{jadwal.pembimbing1} & {jadwal.pembimbing2}</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <span className="icon"><User className="w-5 h-5" /></span>
                      <div>
                        <span className="label">Penguji</span>
                        <span className="value">{jadwal.penguji}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="jadwal-card-footer">
                  {jadwal.is_own_seminar ? (
                    <span className="badge-own-seminar" style={{ background: '#3b82f6', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: '600' }}>
                      <Calendar className="w-4 h-4 inline-block mr-1" />Seminar Anda
                    </span>
                  ) : jadwal.is_registered ? (
                    <span className="badge-registered"><CheckCircle className="w-4 h-4 inline-block mr-1" />Sudah Mendaftar</span>
                  ) : (
                    <button className="btn-register" onClick={() => handleRegister(jadwal.id)}>
                      Daftar Hadir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  async function handleRegister(scheduleId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/mahasiswa/attendance/register`,
        { seminar_schedule_id: scheduleId },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      alert(response.data.message || 'Berhasil mendaftar hadir');
      await fetchJadwal(); // Refresh data
    } catch (err) {
      console.error('Error registering:', err);
      alert(err.response?.data?.message || 'Gagal mendaftar hadir');
    }
  }
}

export default Jadwal;
