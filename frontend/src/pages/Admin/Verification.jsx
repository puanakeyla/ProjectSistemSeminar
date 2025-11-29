import { useState, useEffect } from 'react';
import './Verification.css';
import { adminAPI } from '../../services/api';
import { CheckCircle, XCircle, Clock, Calendar, ClipboardList, BookOpen, User, AlertTriangle } from 'lucide-react'

function Verification() {
  const [seminars, setSeminars] = useState([]);
  const [selectedSeminar, setSelectedSeminar] = useState(null);
  const [seminarDetail, setSeminarDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    fetchSeminars();
  }, []);

  const fetchSeminars = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getSeminarsForVerification('pending_verification');
      setSeminars(data);
    } catch (err) {
      console.error('Error fetching seminars:', err);
      setError(err.response?.data?.message || 'Gagal memuat daftar seminar');
    } finally {
      setLoading(false);
    }
  };

  const fetchSeminarDetail = async (seminarId) => {
    try {
      setDetailLoading(true);
      const data = await adminAPI.getSeminarDetail(seminarId);
      setSeminarDetail(data);
    } catch (err) {
      console.error('Error fetching seminar detail:', err);
      alert('Gagal memuat detail seminar');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSelectSeminar = (seminar) => {
    setSelectedSeminar(seminar);
    fetchSeminarDetail(seminar.id);
  };

  const handleVerify = async (status) => {
    if (!selectedSeminar) return;

    const confirmMsg = status === 'approved'
      ? 'Apakah Anda yakin ingin menyetujui seminar ini?'
      : 'Apakah Anda yakin ingin menolak seminar ini?';

    if (!window.confirm(confirmMsg)) return;

    try {
      setVerifyLoading(true);
      await adminAPI.verifySeminar(selectedSeminar.id, { status });

      alert(status === 'approved' ? 'Seminar berhasil diverifikasi!' : 'Seminar ditolak');

      // Refresh data
      await fetchSeminars();
      setSelectedSeminar(null);
      setSeminarDetail(null);
    } catch (err) {
      console.error('Error verifying seminar:', err);
      alert(err.response?.data?.message || 'Gagal memverifikasi seminar');
    } finally {
      setVerifyLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getApprovalStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-success inline-block mr-1" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-danger inline-block mr-1" />;
      default: return <Clock className="w-4 h-4 inline-block mr-1" />;
    }
  };

  const getApprovalStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      default: return 'pending';
    }
  };

  if (loading) {
    return (
      <div className="admin-verification">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Memuat daftar seminar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-verification">
      <div className="verification-header">
        <h1>Verifikasi Seminar</h1>
        <p>Periksa status approval dosen dan verifikasi seminar untuk penjadwalan</p>
      </div>

      {error && (
        <div className="error-message">
          <AlertTriangle className="w-5 h-5 inline mr-2 text-warning" /> {error}
        </div>
      )}

      <div className="verification-layout">
        {/* Seminar List */}
        <div className="seminars-list">
          <div className="list-header">
            <h3>Seminar Menunggu Verifikasi</h3>
            <span className="count">{seminars.length}</span>
          </div>

          {seminars.length === 0 ? (
            <div className="empty-list">
              <div className="empty-icon"><CheckCircle className="w-6 h-6" /></div>
              <p>Tidak ada seminar yang menunggu verifikasi</p>
            </div>
          ) : (
            <div className="seminar-items">
              {seminars.map((seminar) => (
                <div
                  key={seminar.id}
                  className={`seminar-item ${selectedSeminar?.id === seminar.id ? 'active' : ''}`}
                  onClick={() => handleSelectSeminar(seminar)}
                >
                  <div className="seminar-item-header">
                    <span className={`type-badge ${seminar.tipe}`}>
                      {seminar.tipe === 'proposal' ? '📋' : '📘'} {seminar.tipe}
                    </span>
                    <span className="approval-count">
                      {seminar.approval_count || 0}/3
                    </span>
                  </div>
                  <h4>{seminar.judul}</h4>
                  <div className="seminar-item-info">
                    <span><User className="w-4 h-4 inline mr-1" /> {seminar.mahasiswa_name}</span>
                    <span><span className="mx-2">|</span> {seminar.mahasiswa_npm}</span>
                  </div>
                  <div className="seminar-item-footer">
                    <span className="date"><Calendar className="w-4 h-4 inline mr-1"/> {formatDate(seminar.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="detail-panel">
          {!selectedSeminar ? (
            <div className="no-selection">
              <div className="no-selection-icon"><ClipboardList className="w-8 h-8"/></div>
              <h3>Pilih Seminar</h3>
              <p>Pilih seminar dari daftar untuk melihat detail dan status approval</p>
            </div>
          ) : detailLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Memuat detail seminar...</p>
            </div>
          ) : seminarDetail ? (
            <>
              {/* Seminar Info */}
              <div className="detail-section">
                <h2>Informasi Seminar</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Judul:</label>
                    <p>{seminarDetail.judul}</p>
                  </div>
                  <div className="info-item">
                    <label>Tipe:</label>
                    <p>
                      <span className={`type-badge ${seminarDetail.tipe}`}>
                        {seminarDetail.tipe === 'proposal' ? (<><ClipboardList className="w-4 h-4 inline mr-1"/> Proposal</>) : (<><BookOpen className="w-4 h-4 inline mr-1"/> Hasil</>)}
                      </span>
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Mahasiswa:</label>
                    <p>{seminarDetail.mahasiswa?.name} ({seminarDetail.mahasiswa?.npm})</p>
                  </div>
                  <div className="info-item">
                    <label>Tanggal Pengajuan:</label>
                    <p>{formatDate(seminarDetail.created_at)}</p>
                  </div>
                  <div className="info-item full-width">
                    <label>Abstrak:</label>
                    <p className="abstrak">{seminarDetail.abstrak || 'Tidak ada abstrak'}</p>
                  </div>
                </div>
              </div>

              {/* Approval Status */}
              <div className="detail-section">
                <h2>Status Approval Dosen</h2>
                  <div className="approvals-list">
                  {seminarDetail.approvals && seminarDetail.approvals.length > 0 ? (
                    seminarDetail.approvals.map((approval, index) => (
                      <div key={index} className={`approval-card ${getApprovalStatusClass(approval.status)}`}>
                        <div className="approval-header">
                          <div className="approval-role">
                            <span className="role-badge">{approval.peran}</span>
                            <span className="dosen-name">{approval.dosen?.name || 'N/A'}</span>
                          </div>
                          <div className="approval-status">
                            <span className={`status-icon ${getApprovalStatusClass(approval.status)}`}>
                              {getApprovalStatusIcon(approval.status)}
                            </span>
                            <span className="status-text">
                              {approval.status === 'approved' ? 'Disetujui' :
                               approval.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                            </span>
                          </div>
                        </div>

                        {approval.status === 'approved' && approval.available_dates && (
                          <div className="available-dates">
                            <label>Tanggal Ketersediaan:</label>
                            <div className="dates-chips">
                              {approval.available_dates.map((date, idx) => (
                                <span key={idx} className="date-chip">
                                  <Calendar className="w-4 h-4 inline mr-1"/> {formatDate(date)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {approval.catatan && (
                          <div className="approval-notes">
                            <label>Catatan:</label>
                            <p>{approval.catatan}</p>
                          </div>
                        )}

                        {approval.approved_at && (
                          <div className="approval-date">
                            Disetujui: {formatDate(approval.approved_at)}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="no-approvals">
                      <p>Belum ada data approval</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
                <div className="action-buttons">
                  <button
                    className="btn-reject"
                    onClick={() => handleVerify('rejected')}
                    disabled={verifyLoading}
                  >
                    {verifyLoading ? 'Memproses...' : (<><XCircle className="w-4 h-4 inline mr-2"/>Tolak Seminar</>)}
                  </button>
                  <button
                    className="btn-approve"
                    onClick={() => handleVerify('approved')}
                    disabled={verifyLoading || (seminarDetail.approvals?.filter(a => a.status === 'approved').length < 3)}
                  >
                    {verifyLoading ? 'Memproses...' : (<><CheckCircle className="w-4 h-4 inline mr-2"/>Setujui & Verifikasi</>)}
                  </button>
                </div>

              {seminarDetail.approvals?.filter(a => a.status === 'approved').length < 3 && (
                <div className="warning-message">
                  <AlertTriangle className="w-4 h-4 inline mr-2 text-warning"/> Seminar hanya dapat diverifikasi jika semua dosen (Pembimbing 1, Pembimbing 2, dan Penguji) telah menyetujui
                </div>
              )}
            </>
          ) : (
            <div className="no-data">
              <p>⚠️ Gagal memuat detail seminar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Verification;
