import { useState } from 'react';
import './Pengajuan.css';

function Pengajuan() {
  const [formData, setFormData] = useState({
    jenis: '',
    judul: '',
    dosen_pembimbing: '',
    tanggal_diajukan: '',
    keterangan: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="pengajuan-wrapper">
      <div className="pengajuan-header">
        <h1>Pengajuan Seminar</h1>
        <p>Form pengajuan seminar proposal/hasil/skripsi</p>
      </div>

      <div className="pengajuan-content">
        <form onSubmit={handleSubmit} className="pengajuan-form">
          <div className="form-row">
            <div className="form-group">
              <label>Jenis Seminar</label>
              <select
                name="jenis"
                value={formData.jenis}
                onChange={handleChange}
                required
              >
                <option value="">Pilih jenis seminar</option>
                <option value="proposal">Seminar Proposal</option>
                <option value="hasil">Seminar Hasil</option>
                <option value="skripsi">Seminar Skripsi</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tanggal Pengajuan</label>
              <input
                type="date"
                name="tanggal_diajukan"
                value={formData.tanggal_diajukan}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Judul Penelitian</label>
            <input
              type="text"
              name="judul"
              value={formData.judul}
              onChange={handleChange}
              placeholder="Masukkan judul penelitian"
              required
            />
          </div>

          <div className="form-group">
            <label>Dosen Pembimbing</label>
            <input
              type="text"
              name="dosen_pembimbing"
              value={formData.dosen_pembimbing}
              onChange={handleChange}
              placeholder="Nama dosen pembimbing"
              required
            />
          </div>

          <div className="form-group">
            <label>Keterangan</label>
            <textarea
              name="keterangan"
              value={formData.keterangan}
              onChange={handleChange}
              rows="4"
              placeholder="Keterangan tambahan (opsional)"
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary">Ajukan Seminar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Pengajuan;
