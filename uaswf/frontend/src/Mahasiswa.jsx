import { useState } from 'react';
import './Mahasiswa.css';

function Mahasiswa() {
  const [mahasiswaList] = useState([
    { nim: '210101', nama: 'Andi Pratama', prodi: 'Teknik Informatika' },
    { nim: '210102', nama: 'Budi Santoso', prodi: 'Sistem Informasi' },
    { nim: '210103', nama: 'Citra Dewi', prodi: 'Teknik Informatika' },
    { nim: '210104', nama: 'Doni Saputra', prodi: 'Sistem Informasi' },
    { nim: '210105', nama: 'Eka Wulandari', prodi: 'Teknik Informatika' }
  ]);

  const handleTambah = () => {
    console.log('Tambah mahasiswa');
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2>Data Mahasiswa</h2>
        <button className="btn-add" onClick={handleTambah}>
          + Tambah Data
        </button>
      </div>

      <div className="content">
        <table className="data-table">
          <thead>
            <tr>
              <th>NIM</th>
              <th>Nama</th>
              <th>Prodi</th>
            </tr>
          </thead>
          <tbody>
            {mahasiswaList.map((mahasiswa) => (
              <tr key={mahasiswa.nim}>
                <td>{mahasiswa.nim}</td>
                <td>{mahasiswa.nama}</td>
                <td>{mahasiswa.prodi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Mahasiswa;
