import { useState, useEffect } from 'react';
import {
  FileEdit,
  Loader2,
  AlertTriangle,
  Inbox,
  Calendar,
  UserRound,
  Upload,
  X,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  MessageSquare,
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
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    mahasiswa_notes: '',
    file: null,
  });

  useEffect(() => {
    fetchSeminars();
  }, []);

  const fetchSeminars = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/mahasiswa/seminars', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const scheduledWithRevisions = (response.data.data || []).filter(
        (s) => s.schedule && s.revision && s.revision.status !== 'completed'
      );
      setSeminars(scheduledWithRevisions);
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
      const response = await axios.get(`http://localhost:8000/api/mahasiswa/seminars/${id}`, {
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

  const handleSubmitRevision = async () => {
    if (!submitForm.file) {
      alert('Silakan upload file revisi');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('mahasiswa_notes', submitForm.mahasiswa_notes);
      formData.append('file', submitForm.file);

      await axios.post(
        `http://localhost:8000/api/mahasiswa/revision-items/${selectedItem.id}/submit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      alert('Revisi berhasil disubmit!');
      setShowSubmitModal(false);
      setSubmitForm({ mahasiswa_notes: '', file: null });

      // Refresh detail
      const detail = await fetchSeminarDetail(selectedSeminar.id);
      setSelectedSeminar(detail);
      fetchSeminars();
    } catch (err) {
      console.error('Error submitting:', err);
      alert(err.response?.data?.message || 'Gagal submit revisi');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems =
    selectedSeminar?.revision?.items?.filter((item) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'pending') return item.status === 'pending';
      if (activeTab === 'submitted') return item.status === 'submitted';
      if (activeTab === 'approved') return item.status === 'approved';
      return true;
    }) || [];

  const stats = {
    total: selectedSeminar?.revision?.items?.length || 0,
    pending: selectedSeminar?.revision?.items?.filter((i) => i.status === 'pending').length || 0,
    submitted: selectedSeminar?.revision?.items?.filter((i) => i.status === 'submitted').length || 0,
    approved: selectedSeminar?.revision?.items?.filter((i) => i.status === 'approved').length || 0,
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
              <p className="revisi-hero-subtitle">Kelola poin-poin revisi dari pembimbing dan penguji</p>
              <h1>Revisi Seminar</h1>
            </div>
          </div>
        </div>

        {seminars.length === 0 ? (
          <div className="revisi-state">
            <div className="revisi-state-icon empty">
              <Inbox size={48} />
            </div>
            <h3>Tidak Ada Revisi</h3>
            <p>Anda belum memiliki revisi seminar yang aktif</p>
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
                  <span className="revisi-progress-badge">{seminar.revision?.progress || 0}%</span>
                </div>

                <h3 className="revisi-item-title">{seminar.judul}</h3>

                <div className="revisi-item-meta">
                  <div className="revisi-meta-item">
                    <Calendar size={16} />
                    <span>{seminar.schedule?.formatted_date}</span>
                  </div>
                  <div className="revisi-meta-item">
                    <Clock size={16} />
                    <span>{seminar.schedule?.formatted_time}</span>
                  </div>
                  <div className="revisi-meta-item">
                    <UserRound size={16} />
                    <span>{seminar.pembimbing1?.name}</span>
                  </div>
                </div>

                <div className="revisi-stats">
                  <div className="revisi-stat">
                    <span className="revisi-stat-value">{seminar.revision?.pending_items || 0}</span>
                    <span className="revisi-stat-label">Pending</span>
                  </div>
                  <div className="revisi-stat">
                    <span className="revisi-stat-value">{seminar.revision?.submitted_items || 0}</span>
                    <span className="revisi-stat-label">Submitted</span>
                  </div>
                  <div className="revisi-stat">
                    <span className="revisi-stat-value">{seminar.revision?.approved_items || 0}</span>
                    <span className="revisi-stat-label">Approved</span>
                  </div>
                  <div className="revisi-stat">
                    <span className="revisi-stat-value">{seminar.revision?.total_items || 0}</span>
                    <span className="revisi-stat-label">Total</span>
                  </div>
                </div>

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
                <h2 className="revisi-modal-title">Detail Revisi Seminar</h2>
                <p className="revisi-modal-subtitle">{selectedSeminar.judul}</p>
              </div>
              <button className="revisi-modal-close" onClick={() => setShowDetailModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="revisi-modal-body">
              <div className="revisi-tabs">
                <button
                  className={`revisi-tab ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
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
                  <p>Tidak ada item revisi</p>
                </div>
              ) : (
                <div className="revisi-items-list">
                  {filteredItems.map((item, index) => (
                    <div key={item.id} className={`revisi-detail-item ${item.status}`}>
                      <div className="revisi-detail-header">
                        <span className="revisi-detail-number">#{index + 1}</span>
                        <div className={`revisi-status-badge ${item.status}`}>
                          {item.status === 'pending' && <Clock size={14} />}
                          {item.status === 'submitted' && <Upload size={14} />}
                          {item.status === 'approved' && <CheckCircle size={14} />}
                          {item.status === 'rejected' && <XCircle size={14} />}
                          <span>{item.status_display}</span>
                        </div>
                      </div>

                      <span className="revisi-detail-category">{item.kategori}</span>
                      <p className="revisi-detail-text">{item.poin_revisi}</p>

                      {item.mahasiswa_notes && (
                        <div className="revisi-detail-notes">
                          <div className="revisi-detail-notes-label">Catatan Anda:</div>
                          <div>{item.mahasiswa_notes}</div>
                        </div>
                      )}

                      {item.file_url && (
                        <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="revisi-file-link">
                          <Download size={16} />
                          Lihat File
                        </a>
                      )}

                      {item.rejection_reason && (
                        <div className="revisi-rejection">
                          <div className="revisi-rejection-label">Alasan Penolakan:</div>
                          <div>{item.rejection_reason}</div>
                        </div>
                      )}

                      {item.status === 'pending' && (
                        <div className="revisi-detail-actions">
                          <button
                            className="revisi-btn revisi-btn-success"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowSubmitModal(true);
                            }}
                          >
                            <Upload size={16} />
                            Submit Revisi
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

      {/* Submit Modal */}
      {showSubmitModal && selectedItem && (
        <div className="revisi-modal-overlay" onClick={() => !submitting && setShowSubmitModal(false)}>
          <div className="revisi-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="revisi-modal-header">
              <div>
                <h2 className="revisi-modal-title">Submit Revisi</h2>
                <p className="revisi-modal-subtitle">{selectedItem.poin_revisi}</p>
              </div>
              <button
                className="revisi-modal-close"
                onClick={() => !submitting && setShowSubmitModal(false)}
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>

            <div className="revisi-modal-body">
              <div className="revisi-form-group">
                <label className="revisi-form-label">Catatan (opsional)</label>
                <textarea
                  className="revisi-form-textarea"
                  value={submitForm.mahasiswa_notes}
                  onChange={(e) => setSubmitForm({ ...submitForm, mahasiswa_notes: e.target.value })}
                  placeholder="Tambahkan catatan untuk revisi ini..."
                  disabled={submitting}
                />
              </div>

              <div className="revisi-form-group">
                <label className="revisi-form-label">Upload File Revisi *</label>
                <input
                  type="file"
                  className="revisi-file-input"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setSubmitForm({ ...submitForm, file: e.target.files[0] })}
                  disabled={submitting}
                />
                {submitForm.file && (
                  <div className="revisi-file-selected">
                    <FileText size={20} />
                    <span>{submitForm.file.name}</span>
                  </div>
                )}
                <div className="revisi-form-hint">Format: PDF, DOC, DOCX (Max 5MB)</div>
              </div>
            </div>

            <div className="revisi-modal-footer">
              <button className="revisi-btn revisi-btn-secondary" onClick={() => setShowSubmitModal(false)} disabled={submitting}>
                Batal
              </button>
              <button className="revisi-btn revisi-btn-success" onClick={handleSubmitRevision} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="icon-spin" size={18} />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Submit Revisi
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
