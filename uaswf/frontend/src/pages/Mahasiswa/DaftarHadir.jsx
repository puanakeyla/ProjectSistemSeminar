import { useState, useEffect } from 'react';
import axios from 'axios';
import './DaftarHadir.css';

const API_URL = 'http://localhost:8000/api';

function DaftarHadir() {
  const [daftarHadirList, setDaftarHadirList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDaftarHadir();
  }, []);

  const fetchDaftarHadir = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/mahasiswa/attendance/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDaftarHadirList(response.data.data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setError('Gagal memuat riwayat kehadiran');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (metode) => {
    return metode === 'qr' ? 'present' : 'manual';
  };

  if (loading) {
    return (
      <div className="daftar-hadir-wrapper">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>Memuat riwayat kehadiran...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="daftar-hadir-wrapper">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h2>Terjadi Kesalahan</h2>
          <p style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</p>
          <button onClick={fetchDaftarHadir} style={{ padding: '12px 24px', background: '#4E8EA2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="daftar-hadir-wrapper">
      <div className="daftar-hadir-header">
        <h1>Daftar Hadir</h1>
        <p>Riwayat kehadiran seminar - Total: {daftarHadirList.length} seminar</p>
      </div>

      <div className="daftar-hadir-content">
        {daftarHadirList.length === 0 ? (
          <div style={{ background: 'white', padding: '60px 20px', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '80px', marginBottom: '20px', opacity: 0.5 }}>📋</div>
            <h2 style={{ color: '#64748b', marginBottom: '12px' }}>Belum Ada Kehadiran</h2>
            <p style={{ color: '#94a3b8' }}>Anda belum mengikuti seminar apapun</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="daftar-hadir-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Jenis Seminar</th>
                    <th>Mahasiswa Pemateri</th>
                    <th>Tanggal</th>
                    <th>Waktu</th>
                    <th>Status</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {daftarHadirList.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>
                        <span className="jenis-badge">{item.jenis_seminar}</span>
                      </td>
                      <td>
                        <div>
                          <div>{item.mahasiswa_name}</div>
                          <small style={{ color: '#64748b' }}>{item.mahasiswa_npm}</small>
                        </div>
                      </td>
                      <td>{item.tanggal_display}</td>
                      <td>{item.waktu_absen_display}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(item.metode_absen)}`}>
                          {item.metode_absen === 'qr' ? '🎫 QR Scan' : '✍️ Manual'}
                        </span>
                      </td>
                      <td>{item.ruangan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="summary-section">
              <div className="summary-card">
                <div className="summary-icon">✅</div>
                <div className="summary-content">
                  <h3>{daftarHadirList.length}</h3>
                  <p>Total Hadir</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">📊</div>
                <div className="summary-content">
                  <h3>{daftarHadirList.filter(item => item.metode_absen === 'qr').length}</h3>
                  <p>Via QR Code</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">✍️</div>
                <div className="summary-content">
                  <h3>{daftarHadirList.filter(item => item.metode_absen === 'manual').length}</h3>
                  <p>Manual</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DaftarHadir;
