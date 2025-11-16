import { useState } from 'react';
import './DaftarHadir.css';

function DaftarHadir() {
  const [daftarHadirList] = useState([
    {
      id: 1,
      jenis: 'Seminar Proposal',
      mahasiswa: 'Andi Pratama',
      tanggal: '15 November 2025',
      waktu: '09:00 WIB',
      status: 'Hadir',
      keterangan: 'Tepat waktu'
    },
    {
      id: 2,
      jenis: 'Seminar Hasil',
      mahasiswa: 'Andi Pratama',
      tanggal: '20 November 2025',
      waktu: '13:00 WIB',
      status: 'Terjadwal',
      keterangan: '-'
    }
  ]);

  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'hadir': return 'present';
      case 'tidak hadir': return 'absent';
      case 'terjadwal': return 'scheduled';
      default: return '';
    }
  };

  return (
    <div className="daftar-hadir-wrapper">
      <div className="daftar-hadir-header">
        <h1>Daftar Hadir</h1>
        <p>Riwayat kehadiran seminar</p>
      </div>

      <div className="daftar-hadir-content">
        <div className="table-responsive">
          <table className="daftar-hadir-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Jenis Seminar</th>
                <th>Mahasiswa</th>
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
                    <span className="jenis-badge">{item.jenis}</span>
                  </td>
                  <td>{item.mahasiswa}</td>
                  <td>{item.tanggal}</td>
                  <td>{item.waktu}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.keterangan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="summary-section">
          <div className="summary-card">
            <div className="summary-icon">✅</div>
            <div className="summary-content">
              <h3>1</h3>
              <p>Hadir</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">❌</div>
            <div className="summary-content">
              <h3>0</h3>
              <p>Tidak Hadir</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon">📅</div>
            <div className="summary-content">
              <h3>1</h3>
              <p>Terjadwal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DaftarHadir;
