import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Navbar from './Navbar';
import './SeminarDetail.css';

const SeminarDetail = ({ seminarId }) => {
  const [seminar, setSeminar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddRevisionModal, setShowAddRevisionModal] = useState(false);
  const [revisionItems, setRevisionItems] = useState([{ poin_revisi: '', kategori: '' }]);
  const [catatanDosen, setCatatanDosen] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [validationStatus, setValidationStatus] = useState('approved');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (seminarId) {
      fetchSeminarDetail();
    }
  }, [seminarId]);

  const handleBack = () => {
    window.dispatchEvent(new CustomEvent('semar:navigate', {
      detail: { page: 'seminar' }
    }));
  };

  const fetchSeminarDetail = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/dosen/seminars/${seminarId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSeminar(response.data.data);
    } catch (error) {
      console.error('Error fetching seminar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setRevisionItems([...revisionItems, { poin_revisi: '', kategori: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (revisionItems.length > 1) {
      setRevisionItems(revisionItems.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...revisionItems];
    newItems[index][field] = value;
    setRevisionItems(newItems);
  };

  const handleSubmitRevision = async () => {
    try {
      setSubmitting(true);
      const response = await axios.post(
        'http://localhost:8000/api/dosen/revisions',
        {
          seminar_id: seminar.id,
          catatan_dosen: catatanDosen,
          items: revisionItems.filter(item => item.poin_revisi.trim() !== '')
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      alert('Revisi berhasil ditambahkan!');
      setShowAddRevisionModal(false);
      setRevisionItems([{ poin_revisi: '', kategori: '' }]);
      setCatatanDosen('');
      fetchSeminarDetail();
    } catch (error) {
      console.error('Error submitting revision:', error);
      alert(error.response?.data?.message || 'Gagal menambahkan revisi');
    } finally {
      setSubmitting(false);
    }
  };

  const openValidateModal = (item) => {
    setSelectedItem(item);
    setValidationStatus('approved');
    setRejectionReason('');
    setShowValidateModal(true);
  };

  const handleValidateItem = async () => {
    try {
      setSubmitting(true);
      const response = await axios.post(
        `http://localhost:8000/api/dosen/revisions/${seminar.revision.id}/items/${selectedItem.id}/validate`,
        {
          status: validationStatus,
          rejection_reason: validationStatus === 'rejected' ? rejectionReason : null
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      alert(response.data.message);
      setShowValidateModal(false);
      setSelectedItem(null);
      fetchSeminarDetail();
    } catch (error) {
      console.error('Error validating item:', error);
      alert(error.response?.data?.message || 'Gagal memvalidasi item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dosen-seminar-detail-page">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Memuat detail seminar...</p>
        </div>
      </div>
    );
  }

  if (!seminar) {
    return (
      <div className="dosen-seminar-detail-page">
        <Navbar />
        <div className="error-container">
          <h2>Seminar tidak ditemukan</h2>
          <button onClick={handleBack}>Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dosen-seminar-detail-page">
      <Navbar />

      <div className="detail-container">
        <button className="btn-back" onClick={handleBack}>
          ← Kembali
        </button>

        {/* Header dengan Avatar, Nama, NPM, Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="detail-header-card"
        >
          <div className="header-left">
            <div className="student-avatar">
              {seminar.mahasiswa.name.charAt(0)}
            </div>
            <div className="student-info">
              <h2>{seminar.mahasiswa.name}</h2>
              <span className="npm">{seminar.mahasiswa.npm}</span>
            </div>
          </div>
          <span className="tipe-badge">
            {seminar.jenis_seminar_display}
          </span>
        </motion.div>

        <h1 className="seminar-title">{seminar.judul}</h1>

        {/* Main Content */}
        <div className="detail-content">
            {/* Status Approval Dosen Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="approval-section"
            >
              <div className="section-card">
                <div className="section-header">
                  <h3>👥 Status Approval Dosen</h3>
                </div>
                <div className="approvals-list">
                  {seminar.approvals && seminar.approvals.map((approval, index) => (
                    <div key={index} className={`approval-card approval-${approval.status}`}>
                      <div className="approval-header">
                        <div className="approval-role">
                          <span className="role-icon">👤</span>
                          <span>{approval.role_display}</span>
                        </div>
                        <span className={`approval-status status-${approval.status}`}>
                          {approval.status === 'approved' ? '✓ Disetujui' :
                           approval.status === 'rejected' ? '✗ Ditolak' :
                           '⏳ Menunggu'}
                        </span>
                      </div>
                      <div className="approval-body">
                        <div className="approval-info-item">
                          <label>Dosen:</label>
                          <p>{approval.dosen?.name || 'N/A'}</p>
                        </div>
                        {approval.catatan && (
                          <div className="approval-info-item">
                            <label>Catatan:</label>
                            <p>{approval.catatan}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Revisions Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="revision-section"
            >
            <div className="revision-header-section">
              <h2>📝 Revisi Kolaboratif</h2>
              <button
                className="btn-add-revision"
                onClick={() => setShowAddRevisionModal(true)}
              >
                + Tambah Poin Revisi
              </button>
            </div>

            {seminar.revision ? (
              <>
                {/* Progress Overview */}
                <div className="progress-card">
                  <div className="progress-header">
                    <h3>Progress Keseluruhan</h3>
                    <span className="progress-percentage">{seminar.revision.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${seminar.revision.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="progress-stats">
                    <div className="stat">
                      <span className="stat-value">{seminar.revision.approved_items}</span>
                      <span className="stat-label">Disetujui</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{seminar.revision.submitted_items}</span>
                      <span className="stat-label">Disubmit</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{seminar.revision.pending_items}</span>
                      <span className="stat-label">Pending</span>
                    </div>
                  </div>
                </div>

                {/* Approval Status per Dosen */}
                <div className="approval-status-card">
                  <h3>Status Approval per Dosen</h3>
                  {seminar.revision.approval_status.map((status, index) => (
                    <div key={index} className="dosen-approval-row">
                      <div className="dosen-info">
                        <span className="dosen-role">{status.role}</span>
                        <span className="dosen-name">{status.dosen_name}</span>
                      </div>
                      <div className="approval-info">
                        <span className="approval-count">
                          {status.approved_count}/{status.total_count}
                        </span>
                        {status.all_approved ? (
                          <span className="approval-badge approved">✓ Approved</span>
                        ) : (
                          <span className="approval-badge pending">⏳ Pending</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Items by Dosen */}
                <div className="items-by-dosen">
                  <h3>Poin Revisi dari Semua Dosen</h3>
                  {seminar.revision.items_by_dosen.map((group, groupIndex) => (
                    <div key={groupIndex} className="dosen-group">
                      <div className="dosen-group-header">
                        <h4>{group.dosen_name}</h4>
                        <div className="group-stats">
                          <span className="stat-badge approved">{group.approved_items} ✓</span>
                          <span className="stat-badge submitted">{group.submitted_items} 📤</span>
                          <span className="stat-badge pending">{group.pending_items} ⏳</span>
                          {group.rejected_items > 0 && (
                            <span className="stat-badge rejected">{group.rejected_items} ✗</span>
                          )}
                        </div>
                      </div>

                      <div className="items-list">
                        {group.items.map((item, itemIndex) => (
                          <div key={itemIndex} className={`item-card item-${item.status}`}>
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

                            {item.mahasiswa_notes && (
                              <div className="mahasiswa-response">
                                <strong>Catatan Mahasiswa:</strong>
                                <p>{item.mahasiswa_notes}</p>
                                {item.file_url && (
                                  <a
                                    href={item.file_url?.startsWith('http') ? item.file_url : `http://localhost:8000${item.file_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="file-link"
                                  >
                                    📄 Lihat File
                                  </a>
                                )}
                                {item.submitted_at && (
                                  <span className="timestamp">Disubmit: {item.submitted_at}</span>
                                )}
                              </div>
                            )}

                            {item.rejection_reason && (
                              <div className="rejection-info">
                                <strong>Alasan Penolakan:</strong>
                                <p>{item.rejection_reason}</p>
                              </div>
                            )}

                            {item.revision_count > 0 && (
                              <span className="revision-count">Revisi ke-{item.revision_count}</span>
                            )}

                            {/* Validation Button - Only for items created by current user and submitted */}
                            {group.dosen_id === seminar.revision.my_items[0]?.id &&
                             item.status === 'submitted' && (
                              <button
                                className="btn-validate"
                                onClick={() => openValidateModal(item)}
                              >
                                Validasi Item
                              </button>
                            )}

                            {item.validated_at && (
                              <span className="timestamp">
                                Divalidasi: {item.validated_at} oleh {item.validator}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* My Items */}
                {seminar.revision.my_items.length > 0 && (
                  <div className="my-items-section">
                    <h3>📋 Poin Revisi Saya ({seminar.revision.my_items.length})</h3>
                    <div className="items-list">
                      {seminar.revision.my_items.map((item, index) => (
                        <div key={index} className={`item-card item-${item.status}`}>
                          <div className="item-header">
                            <span className="item-number">#{index + 1}</span>
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

                          {item.status === 'submitted' && (
                            <button
                              className="btn-validate"
                              onClick={() => openValidateModal(item)}
                            >
                              Validasi Item
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-revision">
                <div className="empty-icon">📝</div>
                <h3>Belum ada revisi</h3>
                <p>Klik tombol "Tambah Poin Revisi" untuk mulai memberikan revisi</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Add Revision Modal */}
      <AnimatePresence>
        {showAddRevisionModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !submitting && setShowAddRevisionModal(false)}
          >
            <motion.div
              className="modal-content large"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Tambah Poin Revisi</h2>

              <div className="form-group">
                <label>Catatan Umum (Opsional)</label>
                <textarea
                  value={catatanDosen}
                  onChange={(e) => setCatatanDosen(e.target.value)}
                  placeholder="Catatan umum untuk mahasiswa..."
                  rows="3"
                />
              </div>

              <div className="items-input-section">
                <h3>Poin-poin Revisi</h3>
                {revisionItems.map((item, index) => (
                  <div key={index} className="item-input-row">
                    <div className="item-number">{index + 1}</div>
                    <div className="item-inputs">
                      <input
                        type="text"
                        placeholder="Poin revisi..."
                        value={item.poin_revisi}
                        onChange={(e) => handleItemChange(index, 'poin_revisi', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Kategori (opsional)"
                        value={item.kategori}
                        onChange={(e) => handleItemChange(index, 'kategori', e.target.value)}
                      />
                    </div>
                    {revisionItems.length > 1 && (
                      <button
                        className="btn-remove-item"
                        onClick={() => handleRemoveItem(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button className="btn-add-item" onClick={handleAddItem}>
                  + Tambah Poin
                </button>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowAddRevisionModal(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  className="btn-submit"
                  onClick={handleSubmitRevision}
                  disabled={submitting || revisionItems.every(item => !item.poin_revisi.trim())}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Revisi'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validate Item Modal */}
      <AnimatePresence>
        {showValidateModal && selectedItem && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !submitting && setShowValidateModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Validasi Poin Revisi</h2>

              <div className="item-preview">
                <p><strong>Poin Revisi:</strong></p>
                <p>{selectedItem.poin_revisi}</p>
                {selectedItem.mahasiswa_notes && (
                  <>
                    <p><strong>Catatan Mahasiswa:</strong></p>
                    <p>{selectedItem.mahasiswa_notes}</p>
                  </>
                )}
              </div>

              <div className="form-group">
                <label>Status Validasi</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="approved"
                      checked={validationStatus === 'approved'}
                      onChange={(e) => setValidationStatus(e.target.value)}
                    />
                    <span>✓ Setujui</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="rejected"
                      checked={validationStatus === 'rejected'}
                      onChange={(e) => setValidationStatus(e.target.value)}
                    />
                    <span>✗ Tolak</span>
                  </label>
                </div>
              </div>

              {validationStatus === 'rejected' && (
                <div className="form-group">
                  <label>Alasan Penolakan *</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Jelaskan kenapa revisi ini ditolak..."
                    rows="4"
                  />
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setShowValidateModal(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  className="btn-submit"
                  onClick={handleValidateItem}
                  disabled={submitting || (validationStatus === 'rejected' && !rejectionReason.trim())}
                >
                  {submitting ? 'Memproses...' : 'Konfirmasi'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeminarDetail;
