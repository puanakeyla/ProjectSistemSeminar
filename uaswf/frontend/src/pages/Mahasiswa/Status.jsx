import { useState } from 'react';
import './Status.css';

function Status() {
  const [statusList] = useState([
    {
      id: 1,
      jenis: 'Seminar Proposal',
      judul: 'Sistem Informasi Berbasis Web untuk Manajemen Perpustakaan',
      tanggal_ajuan: '10 Nov 2025',
      status: 'Disetujui',
      keterangan: 'Seminar dijadwalkan tanggal 20 November 2025'
    },
    {
      id: 2,
      jenis: 'Seminar Hasil',
      judul: 'Implementasi Machine Learning untuk Prediksi Cuaca',
      tanggal_ajuan: '12 Nov 2025',
      status: 'Menunggu',
      keterangan: 'Menunggu persetujuan koordinator'
    },
    {
      id: 3,
      jenis: 'Seminar Proposal',
      judul: 'Aplikasi Mobile untuk Sistem Absensi',
      tanggal_ajuan: '05 Nov 2025',
      status: 'Ditolak',
      keterangan: 'Judul terlalu umum, perlu diperbaiki'
    }
  ]);

  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'disetujui': return 'approved';
      case 'menunggu': return 'pending';
      case 'ditolak': return 'rejected';
      default: return '';
    }
  };

  return (
    <div className="status-wrapper">
      <div className="status-header">
        <h1>Status Pengajuan</h1>
        <p>Pantau status pengajuan seminar Anda</p>
      </div>

      <div className="status-content">
        {statusList.map((item) => (
          <div key={item.id} className={`status-card ${getStatusClass(item.status)}`}>
            <div className="status-card-header">
              <div>
                <span className="jenis-badge">{item.jenis}</span>
                <h3>{item.judul}</h3>
              </div>
              <span className={`status-badge ${getStatusClass(item.status)}`}>
                {item.status}
              </span>
            </div>
            <div className="status-card-body">
              <div className="info-row">
                <span className="info-label">Tanggal Pengajuan:</span>
                <span className="info-value">{item.tanggal_ajuan}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Keterangan:</span>
                <span className="info-value">{item.keterangan}</span>
              </div>
            </div>
            <div className="status-card-footer">
              <button className="btn-detail">Lihat Detail</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Status;
