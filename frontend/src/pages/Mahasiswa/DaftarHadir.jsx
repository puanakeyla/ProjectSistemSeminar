import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Clock, AlertTriangle, Loader2 } from 'lucide-react';
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
      // Normalize response to ensure we always set an array
      const payload = response?.data?.data ?? response?.data;
      const normalizeToArray = (p) => {
        if (!p) return [];
        if (Array.isArray(p)) return p;
        // If the API returned an object with a nested list property, try common names
        if (typeof p === 'object') {
          if (Array.isArray(p.data)) return p.data;
          if (Array.isArray(p.items)) return p.items;
          if (Array.isArray(p.attendances)) return p.attendances;
          // If it's a single record, wrap it in an array
          return [p];
        }
        return [];
      };
      const list = normalizeToArray(payload);
      setDaftarHadirList(list);
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
      <div className="daftar-hadir-wrapper">
        <div className="daftar-hadir-empty-state">
          <div className="daftar-hadir-empty-icon" style={{ background: 'rgba(220, 38, 38, 0.08)', color: '#dc2626' }}>
            <AlertTriangle size={32} />
          </div>
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
          <div className="daftar-hadir-empty-state">
            <div className="daftar-hadir-empty-icon">
              <FileText size={32} />
            </div>
            <h2>Belum Ada Kehadiran</h2>
            <p>Anda belum mengikuti seminar apapun</p>
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
                    <tr key={item.id ?? index}>
                      <td>{index + 1}</td>
                      <td>
                        {item.jenis_seminar && item.jenis_seminar !== '-' ? (
                          <span className="jenis-badge">{item.jenis_seminar}</span>
                        ) : (
                          <span>-</span>
                        )}
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
                  <h3>{Array.isArray(daftarHadirList) ? daftarHadirList.length : 0}</h3>
                  <p>Total Hadir</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">📊</div>
                <div className="summary-content">
                  <h3>{Array.isArray(daftarHadirList) ? daftarHadirList.filter(item => item.metode_absen === 'qr').length : 0}</h3>
                  <p>Via Kode QR</p>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">✍️</div>
                <div className="summary-content">
                  <h3>{Array.isArray(daftarHadirList) ? daftarHadirList.filter(item => item.metode_absen === 'manual').length : 0}</h3>
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
