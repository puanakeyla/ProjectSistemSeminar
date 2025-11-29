import { useState, useEffect } from 'react';
import './Revision.css';
import { adminAPI } from '../../services/api';

function Revision() {
  const [revisions, setRevisions] = useState([]);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    fetchRevisions();
  }, []);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getRevisions();
      setRevisions(response.data || []);
    } catch (err) {
      console.error('Error fetching revisions:', err);
      setRevisions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (revisionId, status, catatan = '') => {
    if (!window.confirm(`${status === 'approved' ? 'Setujui' : 'Tolak'} revisi ini?`)) {
      return;
    }

    try {
      setValidating(true);
      
      await adminAPI.validateRevision(revisionId, {
        status,
        catatan_admin: catatan || undefined
      });

      alert(`Revisi berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`);
      setSelectedRevision(null);
      await fetchRevisions();
    } catch (err) {
      console.error('Error validating revision:', err);
      alert('Gagal memvalidasi revisi');
    } finally {
      setValidating(false);
    }
  };

  const handleDownload = (filePath) => {
    const baseUrl = 'http://127.0.0.1:8000';
    window.open(`${baseUrl}/storage/${filePath}`, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: '⏳ Menunggu', class: 'pending' },
      approved: { label: '✅ Disetujui', class: 'approved' },
      rejected: { label: '❌ Ditolak', class: 'rejected' }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="admin-revision">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Memuat data revisi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-revision">
      {/* Header */}
      <div className="revision-header">
        <div className="header-content">
          <h1>Validasi Revisi</h1>
          <p>Kelola dan validasi revisi seminar mahasiswa</p>
        </div>
        <button className="refresh-btn" onClick={fetchRevisions}>
          <span>🔄</span> Refresh
        </button>
      </div>

      <div className="revision-layout">
        {/* Revisions List */}
        <div className="revisions-panel">
          <div className="panel-header">
            <h2>Daftar Revisi</h2>
            <span className="count-badge">{revisions.length}</span>
          </div>

          {revisions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h3>Tidak Ada Revisi</h3>
              <p>Belum ada revisi yang diajukan</p>
            </div>
          ) : (
            <div className="revisions-list">
              {revisions.map((revision) => {
                const statusBadge = getStatusBadge(revision.status);
                
                return (
                  <div 
                    key={revision.id}
                    className={`revision-card ${selectedRevision?.id === revision.id ? 'selected' : ''} ${revision.status}`}
                    onClick={() => setSelectedRevision(revision)}
                  >
                    <div className="card-header">
                      <span className="revision-number">Revisi #{revision.nomor_revisi}</span>
                      <span className={`status-badge ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <h3>{revision.seminar?.judul}</h3>

                    <div className="card-info">
                      <div className="info-row">
                        <span className="label">Mahasiswa:</span>
                        <span className="value">{revision.mahasiswa?.name}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">NPM:</span>
                        <span className="value">{revision.mahasiswa?.npm}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Tipe:</span>
                        <span className="value">{revision.seminar?.tipe}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Upload:</span>
                        <span className="value">{formatDate(revision.created_at)}</span>
                      </div>
                    </div>

                    {revision.file_path && (
                      <button 
                        className="btn-download-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(revision.file_path);
                        }}
                      >
                        💾 Download File
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="detail-panel">
          {!selectedRevision ? (
            <div className="no-selection">
              <div className="no-selection-icon">📄</div>
              <h3>Pilih Revisi</h3>
              <p>Pilih revisi dari daftar untuk melihat detail dan melakukan validasi</p>
            </div>
          ) : (
            <div className="revision-detail">
              <div className="detail-header">
                <h2>Detail Revisi #{selectedRevision.nomor_revisi}</h2>
                <span className={`status-badge ${getStatusBadge(selectedRevision.status).class}`}>
                  {getStatusBadge(selectedRevision.status).label}
                </span>
              </div>

              {/* Seminar Info */}
              <div className="info-section">
                <h3>Informasi Seminar</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Judul:</label>
                    <p>{selectedRevision.seminar?.judul}</p>
                  </div>
                  <div className="info-item">
                    <label>Tipe:</label>
                    <p>
                      <span className={`type-badge ${selectedRevision.seminar?.tipe}`}>
                        {selectedRevision.seminar?.tipe === 'proposal' ? '📋 Proposal' : '📘 Hasil'}
                      </span>
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Mahasiswa:</label>
                    <p>{selectedRevision.mahasiswa?.name} ({selectedRevision.mahasiswa?.npm})</p>
                  </div>
                  <div className="info-item">
                    <label>Tanggal Upload:</label>
                    <p>{formatDate(selectedRevision.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Revision Details */}
              <div className="info-section">
                <h3>Catatan Revisi</h3>
                <div className="notes-box">
                  <p>{selectedRevision.catatan || 'Tidak ada catatan'}</p>
                </div>
              </div>

              {/* File */}
              {selectedRevision.file_path && (
                <div className="file-section">
                  <h3>File Revisi</h3>
                  <div className="file-card">
                    <div className="file-icon">📎</div>
                    <div className="file-info">
                      <p className="file-name">{selectedRevision.file_path.split('/').pop()}</p>
                      <button 
                        className="btn-download-file"
                        onClick={() => handleDownload(selectedRevision.file_path)}
                      >
                        💾 Download File
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Response */}
              {selectedRevision.catatan_admin && (
                <div className="info-section">
                  <h3>Catatan Admin</h3>
                  <div className="notes-box admin-notes">
                    <p>{selectedRevision.catatan_admin}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedRevision.status === 'pending' && (
                <div className="action-section">
                  <h3>Validasi Revisi</h3>
                  <div className="action-buttons">
                    <button
                      className="btn-reject"
                      onClick={() => {
                        const catatan = prompt('Masukkan catatan penolakan (opsional):');
                        handleValidate(selectedRevision.id, 'rejected', catatan || '');
                      }}
                      disabled={validating}
                    >
                      {validating ? 'Memproses...' : '❌ Tolak Revisi'}
                    </button>
                    <button
                      className="btn-approve"
                      onClick={() => handleValidate(selectedRevision.id, 'approved')}
                      disabled={validating}
                    >
                      {validating ? 'Memproses...' : '✅ Setujui Revisi'}
                    </button>
                  </div>
                  
                  <div className="info-box">
                    <p>💡 <strong>Catatan:</strong></p>
                    <ul>
                      <li>Pastikan file revisi sudah sesuai dengan persyaratan</li>
                      <li>Periksa kelengkapan dokumen sebelum menyetujui</li>
                      <li>Berikan catatan jika revisi ditolak</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Revision;
