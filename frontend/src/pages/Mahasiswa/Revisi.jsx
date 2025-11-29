import { useState, useEffect } from 'react';
import api from '../../services/api';
import './Revisi.css';
import { Calendar, FileText, MessageSquare, Paperclip, CheckCircle } from 'lucide-react'

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

      // Normalize responses to arrays
      const normalize = (p) => {
        const payload = p?.data ?? p;
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload.data)) return payload.data;
        if (Array.isArray(payload.items)) return payload.items;
        if (Array.isArray(payload.revisions)) return payload.revisions;
        // If it's a single object, wrap it
        if (typeof payload === 'object') return [payload];
        return [];
      };

      setRevisiList(normalize(revisionsRes.data?.data ?? revisionsRes.data));
      setAvailableSeminars(normalize(seminarsRes.data?.data ?? seminarsRes.data));
      setError('');
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Gagal memuat data revisi. Coba lagi.');
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
        setError('Ukuran file maksimal 10MB');
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

      setSuccess('Revisi berhasil diupload!');
      setError('');
      setUploadModal(false);
      fetchData();
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.response?.data?.message || 'Gagal mengupload revisi');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'submitted': 'pending',
      'accepted': 'uploaded',
      'rejected': 'rejected',
      'reviewed': 'pending'
    };
    return statusMap[status] || 'pending';
  };

  const getStatusText = (status) => {
    const textMap = {
      'submitted': 'Menunggu Validasi',
      'accepted': 'Disetujui',
      'rejected': 'Ditolak',
      'reviewed': 'Perlu Revisi'
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

      {error && (
        <div className="alert error-banner">
          <div className="alert-content">{error}</div>
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      {success && (
        <div className="alert success-banner">
          <div className="alert-content">{success}</div>
          <button className="alert-close" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      <div className="revisi-content">
        {!Array.isArray(revisiList) || revisiList.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada revisi yang diupload</p>
            <button className="btn-upload" onClick={() => handleUpload()}>
              Upload Revisi Pertama
            </button>
          </div>
        ) : (
          (Array.isArray(revisiList) ? revisiList : []).map((revisi) => (
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
                <span className="icon"><Calendar className="w-5 h-5" /></span>
                <div>
                  <span className="label">Tanggal Pengumpulan</span>
                  <span className="value">{revisi.tanggal_pengumpulan_display}</span>
                </div>
              </div>

              {revisi.catatan_mahasiswa && (
                <div className="catatan-section">
                  <span className="icon"><FileText className="w-5 h-5" /></span>
                  <div>
                    <span className="label">Catatan Mahasiswa</span>
                    <p className="catatan-text">{revisi.catatan_mahasiswa}</p>
                  </div>
                </div>
              )}

              {revisi.catatan_admin && (
                <div className="catatan-section admin-note">
                  <span className="icon"><MessageSquare className="w-5 h-5" /></span>
                  <div>
                    <span className="label">Catatan Admin</span>
                    <p className="catatan-text">{revisi.catatan_admin}</p>
                  </div>
                </div>
              )}

              {revisi.file_revisi && (
                <div className="info-row">
                  <span className="icon"><Paperclip className="w-5 h-5" /></span>
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
              {revisi.status === 'accepted' && (
                <div className="approval-info"><CheckCircle className="w-4 h-4 inline-block mr-1" />Revisi telah disetujui admin</div>
              )}
              {['rejected', 'reviewed'].includes(revisi.status) && (
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
                  {Array.isArray(availableSeminars) ? availableSeminars.map(seminar => (
                    <option key={seminar.id} value={seminar.id}>
                      {seminar.jenis_seminar} - {seminar.judul}
                    </option>
                  )) : null}
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
