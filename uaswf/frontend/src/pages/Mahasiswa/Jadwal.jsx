import { useState, useEffect } from 'react';
import axios from 'axios';
import './Jadwal.css';

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
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>Memuat jadwal...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="jadwal-wrapper">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
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
          <div style={{ background: 'white', padding: '60px 20px', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px', opacity: 0.5 }}>📅</div>
            <h2 style={{ color: '#64748b', marginBottom: '12px' }}>Belum Ada Jadwal</h2>
            <p style={{ color: '#94a3b8' }}>Jadwal seminar akan muncul setelah admin menjadwalkan</p>
          </div>
        ) : (
          <div className="jadwal-grid">
            {jadwalList.map((jadwal) => (
              <div key={jadwal.id} className="jadwal-card">
                <div className="jadwal-card-header">
                  <span className="jenis-badge">{jadwal.jenis_seminar}</span>
                  <h3>{jadwal.mahasiswa_name}</h3>
                  <span className="npm-badge">{jadwal.mahasiswa_npm}</span>
                </div>

                <div className="jadwal-card-body">
                  <h4 className="judul-seminar">{jadwal.judul}</h4>
                  
                  <div className="jadwal-info">
                    <div className="info-item">
                      <span className="icon">📅</span>
                      <div>
                        <span className="label">Tanggal</span>
                        <span className="value">{jadwal.tanggal_display}</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <span className="icon">🕐</span>
                      <div>
                        <span className="label">Waktu</span>
                        <span className="value">{jadwal.waktu_display}</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <span className="icon">🏢</span>
                      <div>
                        <span className="label">Ruangan</span>
                        <span className="value">{jadwal.ruangan}</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <span className="icon">👨‍🏫</span>
                      <div>
                        <span className="label">Pembimbing</span>
                        <span className="value">{jadwal.pembimbing1} & {jadwal.pembimbing2}</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <span className="icon">👨‍💼</span>
                      <div>
                        <span className="label">Penguji</span>
                        <span className="value">{jadwal.penguji}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="jadwal-card-footer">
                  {jadwal.is_registered ? (
                    <span className="badge-registered">✓ Sudah Mendaftar</span>
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
