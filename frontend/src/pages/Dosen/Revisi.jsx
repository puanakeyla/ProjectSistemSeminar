import { useState, useEffect } from 'react';
import {
  FileEdit,
  Loader2,
  AlertTriangle,
  Inbox,
  Calendar,
  UserRound,
  Plus,
  X,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import axios from 'axios';
import './Revisi.css';

function Revisi() {
  const [seminars, setSeminars] = useState([]);
  const [selectedSeminar, setSelectedSeminar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    poin_revisi: '',
    kategori: '',
  });
  const [validateAction, setValidateAction] = useState('approve');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchSeminars();
  }, []);

  const fetchSeminars = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/dosen/seminars', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Show seminars where dosen is involved (pembimbing/penguji)
      // Include both scheduled seminars AND pending_verification (for revision before admin approval)
      const mySeminars = (response.data.data || []).filter(
        (s) => s.my_role && s.my_role.trim() !== ''
      );
      setSeminars(mySeminars);
    } catch (err) {
      console.error('Error fetching seminars:', err);
      setError(err.response?.data?.message || 'Gagal memuat data seminar');
    } finally {
      setLoading(false);
    }
  };

  const fetchSeminarDetail = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/api/dosen/seminars/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    } catch (err) {
      console.error('Error fetching detail:', err);
      throw err;
    }
  };

  const handleViewDetail = async (seminar) => {
    try {
      const detail = await fetchSeminarDetail(seminar.id);
      setSelectedSeminar(detail);
      setShowDetailModal(true);
    } catch (err) {
      alert('Gagal memuat detail seminar');
    }
  };

  const handleAddRevision = async () => {
    if (!addForm.poin_revisi || !addForm.kategori) {
      alert('Silakan isi semua field');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/api/dosen/seminars/${selectedSeminar.id}/revision-items`, addForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Poin revisi berhasil ditambahkan!');
      setShowAddModal(false);
      setAddForm({ poin_revisi: '', kategori: '' });

      const detail = await fetchSeminarDetail(selectedSeminar.id);
      setSelectedSeminar(detail);
      fetchSeminars();
    } catch (err) {
      console.error('Error adding revision:', err);
      alert(err.response?.data?.message || 'Gagal menambahkan poin revisi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateRevision = async () => {
    if (validateAction === 'reject' && !rejectionReason) {
      alert('Silakan isi alasan penolakan');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:8000/api/dosen/revision-items/${selectedItem.id}/validate`,
        {
          action: validateAction,
          rejection_reason: validateAction === 'reject' ? rejectionReason : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(`Revisi berhasil ${validateAction === 'approve' ? 'disetujui' : 'ditolak'}!`);
      setShowValidateModal(false);
      setRejectionReason('');

      const detail = await fetchSeminarDetail(selectedSeminar.id);
      setSelectedSeminar(detail);
      fetchSeminars();
    } catch (err) {
      console.error('Error validating:', err);
      alert(err.response?.data?.message || 'Gagal validasi revisi');
    } finally {
      setSubmitting(false);
    }
  };

  const myItems = selectedSeminar?.revision?.my_items || [];
  const filteredItems = myItems.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return item.status === 'pending';
    if (activeTab === 'submitted') return item.status === 'submitted';
    if (activeTab === 'approved') return item.status === 'approved';
    return true;
  });

  const stats = {
    total: myItems.length,
    pending: myItems.filter((i) => i.status === 'pending').length,
    submitted: myItems.filter((i) => i.status === 'submitted').length,
    approved: myItems.filter((i) => i.status === 'approved').length,
  };

  if (loading) {
    return (
      <div className="revisi-page">
        <div className="revisi-card">
          <div className="revisi-state">
            <div className="revisi-state-icon">
              <Loader2 size={32} className="icon-spin" />
            </div>
            <h2>Memuat data...</h2>
            <p>Harap tunggu sebentar.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="revisi-page">
        <div className="revisi-state">
          <div className="revisi-state-icon error">
            <AlertTriangle size={32} />
          </div>
          <h2>Terjadi Kesalahan</h2>
          <p>{error}</p>
          <button onClick={fetchSeminars} className="revisi-retry-btn">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="revisi-page">
      <div className="revisi-card">
        <div className="revisi-hero">
          <div className="revisi-hero-title">
            <div className="revisi-hero-icon">
              <FileEdit size={28} />
            </div>
            <div className="revisi-hero-text">
              <p className="revisi-hero-subtitle">Tambahkan dan validasi poin revisi mahasiswa</p>
              <h1>Kelola Revisi Seminar</h1>
            </div>
          </div>
        </div>

        {seminars.length === 0 ? (
          <div className="revisi-state">
            <div className="revisi-state-icon empty">
              <Inbox size={48} />
            </div>
            <h3>Tidak Ada Seminar</h3>
            <p>Belum ada seminar yang perlu dikelola revisinya</p>
          </div>
        ) : (
          <div className="revisi-list">
            {seminars.map((seminar) => (
              <div key={seminar.id} className="revisi-item" onClick={() => handleViewDetail(seminar)}>
                <div className="revisi-item-header">
                  <span className="revisi-item-type">
                    <FileEdit size={16} />
                    {seminar.jenis_seminar_display}
                  </span>
                  <span className="revisi-role-badge">
                    {seminar.my_role === 'pembimbing1'
                      ? 'Pembimbing 1'
                      : seminar.my_role === 'pembimbing2'
                      ? 'Pembimbing 2'
                      : 'Penguji'}
                  </span>
                </div>

                <h3 className="revisi-item-title">{seminar.judul}</h3>

                <div className="revisi-item-meta">
                  <div className="revisi-meta-item">
                    <UserRound size={16} />
                    <span>{seminar.mahasiswa?.name}</span>
                  </div>
                  <div className="revisi-meta-item">
                    <Calendar size={16} />
                    <span>{seminar.schedule?.formatted_date}</span>
                  </div>
                  <div className="revisi-meta-item">
                    <Clock size={16} />
                    <span>{seminar.schedule?.formatted_time}</span>
                  </div>
                </div>

                {seminar.revision && (
                  <div className="revisi-stats">
                    <div className="revisi-stat">
                      <span className="revisi-stat-value">{seminar.revision.progress || 0}%</span>
                      <span className="revisi-stat-label">Progress</span>
                    </div>
                  </div>
                )}

                <div className="revisi-item-actions">
                  <button className="revisi-btn revisi-btn-primary">
                    <FileEdit size={18} />
                    Kelola Revisi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSeminar && (
        <div className="revisi-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="revisi-modal" onClick={(e) => e.stopPropagation()}>
            <div className="revisi-modal-header">
              <div>
                <h2 className="revisi-modal-title">Kelola Revisi Seminar</h2>
                <p className="revisi-modal-subtitle">{selectedSeminar.judul}</p>
                <p className="revisi-modal-subtitle">
                  {selectedSeminar.mahasiswa?.name} - {selectedSeminar.mahasiswa?.npm}
                </p>
              </div>
              <button className="revisi-modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="revisi-modal-body">
              <div className="revisi-action-bar">
                <button className="revisi-add-btn" onClick={() => setShowAddModal(true)}>
                  <Plus size={20} />
                  Tambah Poin Revisi
                </button>
              </div>

              <div className="revisi-tabs">
                <button className={`revisi-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
                  Semua ({stats.total})
                </button>
                <button
                  className={`revisi-tab ${activeTab === 'pending' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pending')}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  className={`revisi-tab ${activeTab === 'submitted' ? 'active' : ''}`}
                  onClick={() => setActiveTab('submitted')}
                >
                  Submitted ({stats.submitted})
                </button>
                <button
                  className={`revisi-tab ${activeTab === 'approved' ? 'active' : ''}`}
                  onClick={() => setActiveTab('approved')}
                >
                  Approved ({stats.approved})
                </button>
              </div>

              {filteredItems.length === 0 ? (
                <div className="revisi-state">
                  <div className="revisi-state-icon empty">
                    <Inbox size={32} />
                  </div>
                  <p>Belum ada poin revisi</p>
                </div>
              ) : (
                <div className="revisi-items-list">
                  {filteredItems.map((item, index) => (
                    <div key={item.id} className={`revisi-detail-item ${item.status}`}>
                      <div className="revisi-detail-header">
                        <span className="revisi-detail-number">#{index + 1}</span>
                        <div className={`revisi-status-badge ${item.status}`}>
                          {item.status === 'pending' && <Clock size={14} />}
                          {item.status === 'submitted' && <FileText size={14} />}
                          {item.status === 'approved' && <CheckCircle size={14} />}
                          {item.status === 'rejected' && <XCircle size={14} />}
                          <span>{item.status_display}</span>
                        </div>
                      </div>

                      <span className="revisi-detail-category">{item.kategori}</span>
                      <p className="revisi-detail-text">{item.poin_revisi}</p>

                      {item.mahasiswa_notes && (
                        <div className="revisi-detail-notes">
                          <div className="revisi-detail-notes-label">Catatan Mahasiswa:</div>
                          <div>{item.mahasiswa_notes}</div>
                        </div>
                      )}

                      {item.file_url && (
                        <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="revisi-file-link">
                          <Download size={16} />
                          Download File Revisi
                        </a>
                      )}

                      {item.rejection_reason && (
                        <div className="revisi-rejection">
                          <div className="revisi-rejection-label">Alasan Penolakan:</div>
                          <div>{item.rejection_reason}</div>
                        </div>
                      )}

                      {item.submitted_at && (
                        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--revisi-muted)' }}>
                          Disubmit: {item.submitted_at}
                        </div>
                      )}

                      {item.status === 'submitted' && (
                        <div className="revisi-detail-actions">
                          <button
                            className="revisi-btn revisi-btn-approve"
                            onClick={() => {
                              setSelectedItem(item);
                              setValidateAction('approve');
                              setShowValidateModal(true);
                            }}
                          >
                            <ThumbsUp size={16} />
                            Setujui
                          </button>
                          <button
                            className="revisi-btn revisi-btn-reject"
                            onClick={() => {
                              setSelectedItem(item);
                              setValidateAction('reject');
                              setShowValidateModal(true);
                            }}
                          >
                            <ThumbsDown size={16} />
                            Tolak
                          </button>
                        </div>
                      )}

                      {item.revision_count > 1 && (
                        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--revisi-muted)' }}>
                          Revisi ke-{item.revision_count}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="revisi-modal-overlay" onClick={() => !submitting && setShowAddModal(false)}>
          <div className="revisi-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="revisi-modal-header">
              <h2 className="revisi-modal-title">Tambah Poin Revisi</h2>
              <button className="revisi-modal-close" onClick={() => !submitting && setShowAddModal(false)} disabled={submitting}>
                <X size={20} />
              </button>
            </div>

            <div className="revisi-modal-body">
              <div className="revisi-form-group">
                <label className="revisi-form-label">Kategori *</label>
                <select
                  className="revisi-form-select"
                  value={addForm.kategori}
                  onChange={(e) => setAddForm({ ...addForm, kategori: e.target.value })}
                  disabled={submitting}
                >
                  <option value="">Pilih kategori</option>
                  <option value="Konten">Konten</option>
                  <option value="Metodologi">Metodologi</option>
                  <option value="Penulisan">Penulisan</option>
                  <option value="Format">Format</option>
                  <option value="Referensi">Referensi</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="revisi-form-group">
                <label className="revisi-form-label">Poin Revisi *</label>
                <textarea
                  className="revisi-form-textarea"
                  value={addForm.poin_revisi}
                  onChange={(e) => setAddForm({ ...addForm, poin_revisi: e.target.value })}
                  placeholder="Jelaskan poin yang perlu direvisi..."
                  rows={6}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="revisi-modal-footer">
              <button className="revisi-btn revisi-btn-secondary" onClick={() => setShowAddModal(false)} disabled={submitting}>
                Batal
              </button>
              <button className="revisi-btn revisi-btn-success" onClick={handleAddRevision} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="icon-spin" size={18} />
                    Menambahkan...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Tambahkan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validate Modal */}
      {showValidateModal && selectedItem && (
        <div className="revisi-modal-overlay" onClick={() => !submitting && setShowValidateModal(false)}>
          <div className="revisi-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="revisi-modal-header">
              <h2 className="revisi-modal-title">{validateAction === 'approve' ? 'Setujui Revisi' : 'Tolak Revisi'}</h2>
              <button
                className="revisi-modal-close"
                onClick={() => !submitting && setShowValidateModal(false)}
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>

            <div className="revisi-modal-body">
              <div className="revisi-info-box">
                <div className="revisi-info-label">Poin Revisi:</div>
                <div className="revisi-info-value">{selectedItem.poin_revisi}</div>
              </div>

              {selectedItem.mahasiswa_notes && (
                <div className="revisi-info-box">
                  <div className="revisi-info-label">Catatan Mahasiswa:</div>
                  <div className="revisi-info-value">{selectedItem.mahasiswa_notes}</div>
                </div>
              )}

              {validateAction === 'reject' && (
                <div className="revisi-form-group">
                  <label className="revisi-form-label">Alasan Penolakan *</label>
                  <textarea
                    className="revisi-form-textarea"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Jelaskan mengapa revisi ini ditolak..."
                    rows={4}
                    disabled={submitting}
                  />
                </div>
              )}
            </div>

            <div className="revisi-modal-footer">
              <button className="revisi-btn revisi-btn-secondary" onClick={() => setShowValidateModal(false)} disabled={submitting}>
                Batal
              </button>
              <button
                className={`revisi-btn ${validateAction === 'approve' ? 'revisi-btn-approve' : 'revisi-btn-reject'}`}
                onClick={handleValidateRevision}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="icon-spin" size={18} />
                    Memproses...
                  </>
                ) : validateAction === 'approve' ? (
                  <>
                    <ThumbsUp size={18} />
                    Setujui
                  </>
                ) : (
                  <>
                    <ThumbsDown size={18} />
                    Tolak
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Revisi;
