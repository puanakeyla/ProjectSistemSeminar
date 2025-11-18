import { useState, useEffect } from 'react';
import api from '../../services/api';
import './Revisi.css';

function Revisi() {
  const [revisiList, setRevisiList] = useState([]);
  const [availableSeminars, setAvailableSeminars] = useState([]);
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedRevisi, setSelectedRevisi] = useState(null);
  const [selectedSeminar, setSelectedSeminar] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [revisionsRes, seminarsRes] = await Promise.all([
        api.get('/api/mahasiswa/revisions'),
        api.get('/api/mahasiswa/revisions/seminars/available')
      ]);
      
      setRevisiList(revisionsRes.data.data || []);
      setAvailableSeminars(seminarsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert('Gagal memuat data revisi');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (revisi = null) => {
    setSelectedRevisi(revisi);
    setSelectedSeminar(revisi ? revisi.seminar_id : '');
    setSelectedFile(null);
    setCatatan('');
    setUploadModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file maksimal 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSeminar) {
      alert('Pilih seminar terlebih dahulu');
      return;
    }
    if (!selectedFile) {
      alert('Pilih file untuk diupload');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('seminar_id', selectedSeminar);
      formData.append('file_revisi', selectedFile);
      if (catatan) {
        formData.append('catatan_mahasiswa', catatan);
      }

      await api.post('/api/mahasiswa/revisions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Revisi berhasil diupload!');
      setUploadModal(false);
      fetchData();
    } catch (error) {
      console.error('Upload failed:', error);
      alert(error.response?.data?.message || 'Gagal mengupload revisi');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'menunggu': 'pending',
      'disetujui': 'uploaded',
      'ditolak': 'rejected'
    };
    return statusMap[status] || 'pending';
  };

  const getStatusText = (status) => {
    const textMap = {
      'menunggu': 'Menunggu Validasi',
      'disetujui': 'Disetujui',
      'ditolak': 'Ditolak'
    };
    return textMap[status] || status;
  };

  if (loading) {
    return (
      <div className="revisi-wrapper">
        <div className="loading">Memuat data revisi...</div>
      </div>
    );
  }

  return (
    <div className="revisi-wrapper">
      <div className="revisi-header">
        <h1>Revisi Seminar</h1>
        <p>Daftar revisi dan catatan dari dosen pembimbing/penguji</p>
        <button className="btn-new-revision" onClick={() => handleUpload()}>
          + Upload Revisi Baru
        </button>
      </div>

      <div className="revisi-content">
        {revisiList.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada revisi yang diupload</p>
            <button className="btn-upload" onClick={() => handleUpload()}>
              Upload Revisi Pertama
            </button>
          </div>
        ) : (
          revisiList.map((revisi) => (
          <div key={revisi.id} className="revisi-card">
            <div className="revisi-card-header">
              <div>
                <span className="jenis-badge">{revisi.jenis_seminar}</span>
                <h3>{revisi.judul_seminar}</h3>
              </div>
              <span className={`status-badge ${getStatusBadge(revisi.status)}`}>
                {getStatusText(revisi.status)}
              </span>
            </div>

            <div className="revisi-card-body">
              <div className="info-row">
                <span className="icon">📅</span>
                <div>
                  <span className="label">Tanggal Pengumpulan</span>
                  <span className="value">{revisi.tanggal_pengumpulan_display}</span>
                </div>
              </div>

              {revisi.catatan_mahasiswa && (
                <div className="catatan-section">
                  <span className="icon">📝</span>
                  <div>
                    <span className="label">Catatan Mahasiswa</span>
                    <p className="catatan-text">{revisi.catatan_mahasiswa}</p>
                  </div>
                </div>
              )}

              {revisi.catatan_admin && (
                <div className="catatan-section admin-note">
                  <span className="icon">💬</span>
                  <div>
                    <span className="label">Catatan Admin</span>
                    <p className="catatan-text">{revisi.catatan_admin}</p>
                  </div>
                </div>
              )}

              {revisi.file_revisi && (
                <div className="info-row">
                  <span className="icon">📎</span>
                  <div>
                    <span className="label">File Revisi</span>
                    <a 
                      href={`http://localhost:8000/storage/${revisi.file_revisi}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="value file-link"
                    >
                      {revisi.file_revisi.split('/').pop()}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="revisi-card-footer">
              {revisi.status === 'disetujui' && (
                <div className="approval-info">✅ Revisi telah disetujui admin</div>
              )}
              {revisi.status === 'ditolak' && (
                <button className="btn-reupload" onClick={() => handleUpload(revisi)}>
                  Upload Ulang
                </button>
              )}
            </div>
          </div>
        )))}
      </div>

      {uploadModal && (
        <div className="modal-overlay" onClick={() => setUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload File Revisi</h2>
              <button className="modal-close" onClick={() => setUploadModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Pilih Seminar *</label>
                <select 
                  value={selectedSeminar} 
                  onChange={(e) => setSelectedSeminar(e.target.value)}
                  disabled={selectedRevisi !== null}
                >
                  <option value="">-- Pilih Seminar --</option>
                  {availableSeminars.map(seminar => (
                    <option key={seminar.id} value={seminar.id}>
                      {seminar.jenis_seminar} - {seminar.judul}
                    </option>
                  ))}
                </select>
              </div>

              <div className="upload-area">
                <span className="upload-icon">📄</span>
                <p>{selectedFile ? selectedFile.name : 'Klik untuk pilih file'}</p>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  onChange={handleFileChange}
                />
                <small>Format: PDF, DOC, DOCX (Max 10MB)</small>
              </div>

              <div className="form-group">
                <label>Catatan (Opsional)</label>
                <textarea 
                  rows="3" 
                  placeholder="Keterangan tambahan..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={() => setUploadModal(false)}
                disabled={submitting}
              >
                Batal
              </button>
              <button 
                className="btn-submit" 
                onClick={handleSubmit}
                disabled={submitting || !selectedFile || !selectedSeminar}
              >
                {submitting ? 'Mengupload...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Revisi;
