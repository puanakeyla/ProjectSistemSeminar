import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import './SeminarMahasiswa.css';

const SeminarMahasiswa = () => {
  const [seminars, setSeminars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeminar, setSelectedSeminar] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSeminars();
  }, []);

  const fetchSeminars = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/mahasiswa/seminars', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSeminars(response.data.data);
    } catch (error) {
      console.error('Error fetching seminars:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeminarDetail = async (id) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/mahasiswa/seminars/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSelectedSeminar(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error fetching seminar detail:', error);
    }
  };

  const openSubmitModal = (item) => {
    setSelectedItem(item);
    setSubmissionNotes('');
    setSubmissionFile(null);
    setShowSubmitModal(true);
  };

  const handleFileChange = (e) => {
    setSubmissionFile(e.target.files[0]);
  };

  const handleSubmitItem = async () => {
    if (!submissionFile) {
      alert('Silakan upload file terlebih dahulu');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', submissionFile);
      formData.append('mahasiswa_notes', submissionNotes);

      const response = await axios.post(
        `http://localhost:8000/api/mahasiswa/revisions/${selectedSeminar.revision.id}/items/${selectedItem.id}/submit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert(response.data.message);
      setShowSubmitModal(false);
      setSelectedItem(null);
      
      // Refresh seminar detail
      fetchSeminarDetail(selectedSeminar.id);
      fetchSeminars();
    } catch (error) {
      console.error('Error submitting item:', error);
      alert(error.response?.data?.message || 'Gagal submit item');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status, statusDisplay, statusColor) => {
    return (
      <span className={`status-badge status-${statusColor}`}>
        {statusDisplay}
      </span>
    );
  };

  return (
    <div className="mahasiswa-seminar-container">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="seminar-header"
      >
        <h1>📚 Seminar Saya</h1>
        <p>Kelola seminar dan revisi Anda</p>
      </motion.div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Memuat data seminar...</p>
        </div>
      ) : seminars.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="empty-state"
        >
          <div className="empty-icon">📋</div>
          <h3>Belum ada seminar</h3>
          <p>Anda belum mengajukan seminar</p>
        </motion.div>
      ) : (
        <div className="seminars-list">
          <AnimatePresence>
            {seminars.map((seminar, index) => (
              <motion.div
                key={seminar.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="seminar-card"
                onClick={() => fetchSeminarDetail(seminar.id)}
              >
                <div className="card-header">
                  <h3>{seminar.judul}</h3>
                  {getStatusBadge(seminar.status, seminar.status_display, seminar.status_color)}
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">📖 Jenis:</span>
                    <span className="value">{seminar.jenis_seminar_display}</span>
                  </div>

                  {seminar.schedule && (
                    <>
                      <div className="info-row">
                        <span className="label">📅 Tanggal:</span>
                        <span className="value">{seminar.schedule.formatted_date}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">🕐 Waktu:</span>
                        <span className="value">{seminar.schedule.formatted_time}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">🏢 Ruangan:</span>
                        <span className="value">{seminar.schedule.ruangan}</span>
                      </div>
                    </>
                  )}

                  {seminar.revision && (
                    <div className="revision-preview">
                      <div className="revision-header">
                        <span className="label">📝 Progress Revisi:</span>
                        <span className="percentage">{seminar.revision.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${seminar.revision.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="revision-stats">
                        <span className="stat">✓ {seminar.revision.approved_items} Disetujui</span>
                        <span className="stat">📤 {seminar.revision.submitted_items} Disubmit</span>
                        <span className="stat">⏳ {seminar.revision.pending_items} Pending</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button className="btn-detail">
                    Lihat Detail →
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedSeminar && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              className="modal-content large"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{selectedSeminar.judul}</h2>
                <button className="btn-close" onClick={() => setShowDetailModal(false)}>×</button>
              </div>

              <div className="modal-body">
                {/* Seminar Info */}
                <div className="detail-section">
                  <h3>📋 Informasi Seminar</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Status</label>
                      {getStatusBadge(selectedSeminar.status, selectedSeminar.status_display, selectedSeminar.status_color)}
                    </div>
                    <div className="info-item">
                      <label>Jenis</label>
                      <p>{selectedSeminar.jenis_seminar_display}</p>
                    </div>
                    {selectedSeminar.schedule && (
                      <>
                        <div className="info-item">
                          <label>Tanggal</label>
                          <p>{selectedSeminar.schedule.formatted_date}</p>
                        </div>
                        <div className="info-item">
                          <label>Waktu</label>
                          <p>{selectedSeminar.schedule.formatted_time}</p>
                        </div>
                        <div className="info-item">
                          <label>Ruangan</label>
                          <p>{selectedSeminar.schedule.ruangan}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Revision Section */}
                {selectedSeminar.revision && (
                  <div className="detail-section">
                    <h3>📝 Revisi dari Dosen</h3>
                    
                    {/* Progress */}
                    <div className="progress-section">
                      <div className="progress-header">
                        <span>Progress Keseluruhan</span>
                        <span className="progress-percentage">{selectedSeminar.revision.progress}%</span>
                      </div>
                      <div className="progress-bar large">
                        <div 
                          className="progress-fill"
                          style={{ width: `${selectedSeminar.revision.progress}%` }}
                        />
                      </div>
                      <div className="progress-stats-row">
                        <div className="stat-box">
                          <div className="stat-value approved">{selectedSeminar.revision.approved_items}</div>
                          <div className="stat-label">Disetujui</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value submitted">{selectedSeminar.revision.submitted_items}</div>
                          <div className="stat-label">Disubmit</div>
                        </div>
                        <div className="stat-box">
                          <div className="stat-value pending">{selectedSeminar.revision.pending_items}</div>
                          <div className="stat-label">Pending</div>
                        </div>
                        {selectedSeminar.revision.rejected_items > 0 && (
                          <div className="stat-box">
                            <div className="stat-value rejected">{selectedSeminar.revision.rejected_items}</div>
                            <div className="stat-label">Ditolak</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items by Dosen */}
                    {selectedSeminar.revision.items_by_dosen.map((group, groupIndex) => (
                      <div key={groupIndex} className="dosen-section">
                        <div className="dosen-section-header">
                          <h4>👨‍🏫 {group.dosen_name}</h4>
                          <div className="dosen-stats">
                            <span className="stat-pill approved">{group.approved_items} ✓</span>
                            <span className="stat-pill submitted">{group.submitted_items} 📤</span>
                            <span className="stat-pill pending">{group.pending_items} ⏳</span>
                          </div>
                        </div>

                        <div className="items-list">
                          {group.items.map((item, itemIndex) => (
                            <div key={itemIndex} className={`revision-item item-${item.status}`}>
                              <div className="item-header">
                                <span className="item-number">#{itemIndex + 1}</span>
                                <span className={`item-status status-${item.status_color}`}>
                                  {item.status_display}
                                </span>
                              </div>

                              <div className="item-content">
                                <p className="item-text">{item.poin_revisi}</p>
                                {item.kategori && (
                                  <span className="item-kategori">📌 {item.kategori}</span>
                                )}
                              </div>

                              {item.rejection_reason && (
                                <div className="rejection-box">
                                  <strong>❌ Alasan Penolakan:</strong>
                                  <p>{item.rejection_reason}</p>
                                </div>
                              )}

                              {item.mahasiswa_notes && (
                                <div className="submission-box">
                                  <strong>📝 Catatan Anda:</strong>
                                  <p>{item.mahasiswa_notes}</p>
                                  {item.file_url && (
                                    <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="file-link">
                                      📄 Lihat File Submission
                                    </a>
                                  )}
                                </div>
                              )}

                              {item.revision_count > 0 && (
                                <span className="revision-badge">Revisi ke-{item.revision_count}</span>
                              )}

                              {/* Action Button */}
                              {(item.status === 'pending' || item.status === 'rejected') && (
                                <button 
                                  className="btn-submit-item"
                                  onClick={() => openSubmitModal(item)}
                                >
                                  {item.status === 'rejected' ? 'Submit Ulang' : 'Submit Revisi'}
                                </button>
                              )}

                              {item.submitted_at && (
                                <span className="timestamp">Disubmit: {item.submitted_at}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Item Modal */}
      <AnimatePresence>
        {showSubmitModal && selectedItem && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !submitting && setShowSubmitModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Submit Revisi</h2>

              <div className="item-preview-box">
                <strong>Poin Revisi:</strong>
                <p>{selectedItem.poin_revisi}</p>
                {selectedItem.rejection_reason && (
                  <>
                    <strong className="rejection-label">Alasan Penolakan:</strong>
                    <p className="rejection-text">{selectedItem.rejection_reason}</p>
                  </>
                )}
              </div>

              <div className="form-group">
                <label>Upload File *</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {submissionFile && (
                  <span className="file-name">📄 {submissionFile.name}</span>
                )}
              </div>

              <div className="form-group">
                <label>Catatan (Opsional)</label>
                <textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Tambahkan catatan untuk dosen..."
                  rows="4"
                />
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-cancel"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button 
                  className="btn-submit"
                  onClick={handleSubmitItem}
                  disabled={submitting || !submissionFile}
                >
                  {submitting ? 'Mengirim...' : 'Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeminarMahasiswa;
