import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import './RevisiItems.css';

function RevisiItems() {
  const [activeTab, setActiveTab] = useState('pending'); // pending, approved
  const [revisions, setRevisions] = useState([]);
  const [expandedRevisions, setExpandedRevisions] = useState(new Set());
  const [submitModal, setSubmitModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRevisions();
  }, [activeTab]);

  const fetchRevisions = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/mahasiswa/revisions?status=${activeTab === 'approved' ? 'approved' : 'pending'}`);
      setRevisions(response.data?.data?.all_revisions || []);
    } catch (error) {
      console.error('Failed to fetch revisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRevision = (revisionId) => {
    const newExpanded = new Set(expandedRevisions);
    if (newExpanded.has(revisionId)) {
      newExpanded.delete(revisionId);
    } else {
      newExpanded.add(revisionId);
    }
    setExpandedRevisions(newExpanded);
  };

  const openSubmitModal = (item, revisionId) => {
    setSelectedItem({ ...item, revisionId });
    setSubmitModal(true);
    setNotes('');
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!notes.trim()) {
      alert('Catatan wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('mahasiswa_notes', notes);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await api.post(
        `/api/mahasiswa/revisions/${selectedItem.revisionId}/items/${selectedItem.id}/submit`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      alert('Revisi berhasil disubmit!');
      setSubmitModal(false);
      fetchRevisions();
    } catch (error) {
      console.error('Failed to submit:', error);
      alert(error.response?.data?.message || 'Gagal submit revisi');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, text: 'Belum Dikerjakan', color: 'bg-gray-100 text-gray-700' },
      submitted: { icon: Clock, text: 'Menunggu Validasi', color: 'bg-yellow-100 text-yellow-700' },
      approved: { icon: CheckCircle, text: 'Disetujui', color: 'bg-green-100 text-green-700' },
      rejected: { icon: XCircle, text: 'Perlu Diperbaiki', color: 'bg-red-100 text-red-700' },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const groupedByDosen = revisions.reduce((acc, revision) => {
    const dosenName = revision.dosen_name || 'Unknown';
    if (!acc[dosenName]) {
      acc[dosenName] = [];
    }
    acc[dosenName].push(revision);
    return acc;
  }, {});

  return (
    <div className="revisi-items-container">
      <div className="header">
        <h1 className="title">Revisi Seminar</h1>
        <p className="subtitle">Kelola revisi dari dosen pembimbing dan penguji</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <AlertCircle className="w-4 h-4" />
          Belum Disetujui
        </button>
        <button
          className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          <CheckCircle className="w-4 h-4" />
          Sudah Disetujui
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading">Memuat data...</div>
      ) : revisions.length === 0 ? (
        <div className="empty-state">
          <FileText className="w-16 h-16 text-gray-400" />
          <p>Tidak ada revisi {activeTab === 'approved' ? 'yang sudah disetujui' : 'yang belum disetujui'}</p>
        </div>
      ) : (
        <div className="revisions-list">
          {Object.entries(groupedByDosen).map(([dosenName, dosenRevisions]) => (
            <div key={dosenName} className="dosen-group">
              <h3 className="dosen-name">
                <FileText className="w-5 h-5" />
                Revisi dari {dosenName}
              </h3>

              {dosenRevisions.map((revision) => (
                <motion.div
                  key={revision.id}
                  className="revision-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className="revision-header"
                    onClick={() => toggleRevision(revision.id)}
                  >
                    <div className="revision-info">
                      <h4 className="seminar-title">{revision.seminar_judul}</h4>
                      <div className="progress-info">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${revision.progress}%` }}
                          />
                        </div>
                        <span className="progress-text">
                          {revision.approved_items}/{revision.total_items} Item ({revision.progress}%)
                        </span>
                      </div>
                    </div>
                    <button className="expand-btn">
                      {expandedRevisions.has(revision.id) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <AnimatePresence>
                    {expandedRevisions.has(revision.id) && (
                      <motion.div
                        className="revision-items"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        {revision.items?.map((item) => (
                          <div key={item.id} className="item-card">
                            <div className="item-header">
                              <div className="item-info">
                                {item.kategori && (
                                  <span className="item-kategori">{item.kategori}</span>
                                )}
                                <p className="item-poin">{item.poin_revisi}</p>
                              </div>
                              {getStatusBadge(item.status)}
                            </div>

                            {item.mahasiswa_notes && (
                              <div className="item-notes">
                                <strong>Catatan Anda:</strong>
                                <p>{item.mahasiswa_notes}</p>
                              </div>
                            )}

                            {item.rejection_reason && (
                              <div className="item-rejection">
                                <AlertCircle className="w-4 h-4" />
                                <div>
                                  <strong>Alasan Ditolak:</strong>
                                  <p>{item.rejection_reason}</p>
                                </div>
                              </div>
                            )}

                            {item.revision_count > 0 && (
                              <div className="revision-count">
                                Revisi ke-{item.revision_count + 1}
                              </div>
                            )}

                            <div className="item-actions">
                              {(item.status === 'pending' || item.status === 'rejected') && (
                                <button
                                  className="btn-submit"
                                  onClick={() => openSubmitModal(item, revision.id)}
                                >
                                  <Upload className="w-4 h-4" />
                                  {item.status === 'rejected' ? 'Submit Ulang' : 'Submit Revisi'}
                                </button>
                              )}

                              {item.file_url && (
                                <a
                                  href={item.file_url?.startsWith('http') ? item.file_url : `http://localhost:8000${item.file_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-view"
                                >
                                  <Eye className="w-4 h-4" />
                                  Lihat File
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Submit Modal */}
      <AnimatePresence>
        {submitModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSubmitModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="modal-title">Submit Revisi</h3>
              <p className="modal-subtitle">{selectedItem?.poin_revisi}</p>

              <div className="form-group">
                <label>Catatan *</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Jelaskan perubahan yang sudah Anda lakukan..."
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label>Upload File Bukti (Opsional)</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                {selectedFile && (
                  <p className="file-name">File: {selectedFile.name}</p>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="btn-cancel"
                  onClick={() => setSubmitModal(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  className="btn-submit-modal"
                  onClick={handleSubmit}
                  disabled={submitting || !notes.trim()}
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
}

export default RevisiItems;
