import { useState } from 'react';
import './Jadwal.css';

function Jadwal() {
  const [jadwalList] = useState([
    {
      id: 1,
      jenis: 'Seminar Proposal',
      mahasiswa: 'Andi Pratama',
      tanggal: '20 November 2025',
      waktu: '09:00 - 11:00 WIB',
      ruangan: 'Lab Komputer 1',
      pembimbing: 'Dr. Budi Santoso, M.Kom',
      penguji: 'Prof. Dr. Citra Dewi, M.T'
    },
    {
      id: 2,
      jenis: 'Seminar Hasil',
      mahasiswa: 'Siti Nurhaliza',
      tanggal: '22 November 2025',
      waktu: '13:00 - 15:00 WIB',
      ruangan: 'Ruang Sidang',
      pembimbing: 'Dr. Eko Prasetyo, S.Kom, M.Kom',
      penguji: 'Dr. Fitri Rahmawati, M.T'
    },
    {
      id: 3,
      jenis: 'Seminar Skripsi',
      mahasiswa: 'Doni Saputra',
      tanggal: '25 November 2025',
      waktu: '10:00 - 12:00 WIB',
      ruangan: 'Lab Komputer 2',
      pembimbing: 'Dr. Gita Permata, M.Kom',
      penguji: 'Prof. Dr. Hadi Wijaya, M.T'
    }
  ]);

  return (
    <div className="jadwal-wrapper">
      <div className="jadwal-header">
        <h1>Jadwal Seminar</h1>
        <p>Daftar jadwal seminar yang telah dijadwalkan</p>
      </div>

      <div className="jadwal-content">
        <div className="jadwal-grid">
          {jadwalList.map((jadwal) => (
            <div key={jadwal.id} className="jadwal-card">
              <div className="jadwal-card-header">
                <span className="jenis-badge">{jadwal.jenis}</span>
                <h3>{jadwal.mahasiswa}</h3>
              </div>

              <div className="jadwal-card-body">
                <div className="jadwal-info">
                  <div className="info-item">
                    <span className="icon">📅</span>
                    <div>
                      <span className="label">Tanggal</span>
                      <span className="value">{jadwal.tanggal}</span>
                    </div>
                  </div>

                  <div className="info-item">
                    <span className="icon">🕐</span>
                    <div>
                      <span className="label">Waktu</span>
                      <span className="value">{jadwal.waktu}</span>
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
                      <span className="value">{jadwal.pembimbing}</span>
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
                <button className="btn-detail">Lihat Detail</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Jadwal;
