import { useState, useEffect } from 'react';
import './Verification.css';
import { adminAPI } from '../../services/api';
import { CheckCircle, CheckCircle2, XCircle, Clock, Calendar, CalendarDays, ClipboardList, BookOpen, User, AlertTriangle, Loader2 } from 'lucide-react'

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
      const response = await adminAPI.getSeminarsForVerification('pending_verification');
      const seminarsData = response.data || [];
      
      // Show all seminars with pending_verification status (admin can monitor approval progress)
      setSeminars(seminarsData);
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
      const response = await adminAPI.getSeminarDetail(seminarId);
      setSeminarDetail(response.data?.seminar || response.data || selectedSeminar);
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

  const getRoleLabel = (approval, seminar) => {
    // Check which dosen role this approval is for
    if (seminar && approval.dosen_id) {
      if (seminar.pembimbing1?.id === approval.dosen_id) return 'Pembimbing 1';
      if (seminar.pembimbing2?.id === approval.dosen_id) return 'Pembimbing 2';
      if (seminar.penguji?.id === approval.dosen_id) return 'Penguji';
    }
    
    // Fallback to peran field
    switch (approval.peran) {
      case 'pembimbing1': return 'Pembimbing 1';
      case 'pembimbing2': return 'Pembimbing 2';
      case 'penguji': return 'Penguji';
      default: return approval.peran || 'Unknown';
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

  const getTipeColor = (tipe) => {
    const colors = {
      'proposal': '#3b82f6',
      'seminar_proposal': '#3b82f6',
      'hasil': '#10b981',
      'seminar_hasil': '#10b981',
      'komprehensif': '#8b5cf6'
    };
    return colors[tipe?.toLowerCase()] || '#6b7280';
  };

  const formatTitleCase = (value) => {
    if (!value) return '-';
    return value
      .toString()
      .replace(/_/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="approval-page">
      <div className="approval-card">
        <div className="approval-hero">
          <div className="approval-hero-text">
            <div className="approval-hero-title">
              <div className="approval-hero-icon">
                <ClipboardList size={24} />
              </div>
              <div>
                <p className="approval-hero-subtitle">Periksa status approval dosen dan verifikasi seminar untuk penjadwalan</p>
                <h1>Verifikasi Seminar</h1>
              </div>
            </div>
          </div>
          <div className="approval-hero-badge">
            <span className="approval-hero-badge-count">{seminars.length}</span>
            <span className="approval-hero-badge-label">Menunggu</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertTriangle className="w-5 h-5 inline mr-2 text-warning" /> {error}
          </div>
        )}

        {seminars.length === 0 ? (
          <div className="approval-empty">
            <div className="approval-empty-icon">
              <CheckCircle2 size={36} />
            </div>
            <h2>Tidak Ada Seminar Menunggu Verifikasi</h2>
            <p>Semua pengajuan seminar sudah diproses dengan baik.</p>
          </div>
        ) : (
          <>
            <div className="approvals-section">
              <div className="approvals-grid">
                {seminars.map((seminar) => {
                  const mahasiswaName = seminar.mahasiswa?.name || seminar.mahasiswa_name || 'Mahasiswa';
                  const mahasiswaNpm = seminar.mahasiswa?.npm || seminar.mahasiswa_npm || '-';
                  const seminarType = formatTitleCase(seminar.jenis_seminar_display || seminar.tipe);
                  const approvedCount = seminar.approvals?.filter(a => a.status === 'approved').length || 0;
                  const tanggalPengajuan = formatDate(seminar.created_at);

                  return (
                    <button
                      type="button"
                      key={seminar.id}
                      className={`approval-item ${selectedSeminar?.id === seminar.id ? 'selected' : ''}`}
                      onClick={() => handleSelectSeminar(seminar)}
                    >
                      <div className="approval-item-header">
                        <div className="student-badge">
                          <div className="student-avatar">
                            {mahasiswaName.charAt(0)}
                          </div>
                          <div className="student-info">
                            <h4>{mahasiswaName}</h4>
                            <span className="npm">{mahasiswaNpm}</span>
                          </div>
                        </div>
                        <span
                          className="tipe-badge"
                          style={{ backgroundColor: getTipeColor(seminar.jenis_seminar || seminar.tipe) }}
                        >
                          {seminarType}
                        </span>
                      </div>

                      <h3 className="approval-title">{seminar.judul}</h3>

                      <div className="approval-meta">
                        <span className="meta-item">
                          <span className="meta-icon" aria-hidden="true">
                            <CheckCircle size={14} />
                          </span>
                          {approvedCount}/3 Disetujui
                        </span>
                        <span className="meta-item">
                          <span className="meta-icon" aria-hidden="true">
                            <CalendarDays size={14} />
                          </span>
                          {tanggalPengajuan}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="detail-panel detail-panel--stacked">
              {selectedSeminar ? (
                detailLoading ? (
                  <div className="approval-state">
                    <div className="approval-state-icon">
                      <Loader2 size={32} className="icon-spin" />
                    </div>
                    <h2>Memuat detail seminar...</h2>
                  </div>
                ) : seminarDetail ? (
                  <div className="detail-content">
                    <div className="detail-header">
                      <div className="detail-header-title">
                        <ClipboardList size={20} />
                        <div>
                          <p>Detail Seminar</p>
                          <h2>{seminarDetail.mahasiswa?.name}</h2>
                        </div>
                      </div>
                      <span
                        className="tipe-badge-large"
                        style={{ backgroundColor: getTipeColor(seminarDetail.jenis_seminar || seminarDetail.tipe) }}
                      >
                        {formatTitleCase(seminarDetail.jenis_seminar_display || seminarDetail.tipe)}
                      </span>
                    </div>

                    <div className="detail-sections">
                      <div className="detail-section">
                        <div className="detail-section-header">
                          <BookOpen size={16} />
                          <h3>Informasi Seminar</h3>
                        </div>
                        <div className="detail-info-grid">
                          <div className="detail-info-item">
                            <label>Judul:</label>
                            <p>{seminarDetail.judul}</p>
                          </div>
                          <div className="detail-info-item">
                            <label>NPM:</label>
                            <p>{seminarDetail.mahasiswa?.npm}</p>
                          </div>
                          <div className="detail-info-item">
                            <label>Tanggal Pengajuan:</label>
                            <p>{formatDate(seminarDetail.created_at)}</p>
                          </div>
                          <div className="detail-info-item detail-info-item--full">
                            <label>Abstrak:</label>
                            <p className="abstrak-text">{seminarDetail.abstrak || 'Tidak ada abstrak'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="detail-section">
                        <div className="detail-section-header">
                          <User size={16} />
                          <h3>Status Approval Dosen</h3>
                        </div>
                        <div className="approvals-detail-list">
                          {seminarDetail.approvals && seminarDetail.approvals.length > 0 ? (
                            seminarDetail.approvals.map((approval, index) => (
                              <div key={index} className={`approval-detail-card approval-detail-card--${getApprovalStatusClass(approval.status)}`}>
                                <div className="approval-detail-header">
                                  <div className="approval-detail-role">
                                    <User size={16} />
                                    <span>{getRoleLabel(approval, seminarDetail)}</span>
                                  </div>
                                  <span className={`status-badge-detail status-badge-detail--${getApprovalStatusClass(approval.status)}`}>
                                    {approval.status === 'approved' ? (
                                      <><CheckCircle size={14} /> Disetujui</>
                                    ) : approval.status === 'rejected' ? (
                                      <><XCircle size={14} /> Ditolak</>
                                    ) : (
                                      <><Clock size={14} /> Menunggu</>
                                    )}
                                  </span>
                                </div>
                                <div className="approval-detail-body">
                                  <div className="approval-dosen-info">
                                    <label>Dosen:</label>
                                    <p>{approval.dosen?.name || 'N/A'}</p>
                                  </div>
                                  {approval.status === 'approved' && approval.available_dates && (
                                    <div className="approval-dates">
                                      <label>Tanggal Tersedia:</label>
                                      <div className="dates-list">
                                        {(Array.isArray(approval.available_dates) 
                                          ? approval.available_dates 
                                          : approval.available_dates.split(',')
                                        ).map((date, i) => (
                                          <span key={i} className="date-chip">
                                            <CalendarDays size={12} /> {formatDate(typeof date === 'string' ? date.trim() : date)}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {(approval.catatan || approval.alasan) && (
                                    <div className="approval-note">
                                      <label>Catatan:</label>
                                      <p>{approval.catatan || approval.alasan}</p>
                                    </div>
                                  )}
                                  {approval.approved_at && approval.status === 'approved' && (
                                    <div className="approval-date-info">
                                      Disetujui: {formatDate(approval.approved_at || approval.updated_at)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="no-approvals">
                              <p>Belum ada data approval</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {seminarDetail.approvals?.filter(a => a.status === 'approved').length < 3 && (
                      <div className="warning-box">
                        <AlertTriangle size={16} />
                        <p>Seminar hanya dapat diverifikasi jika semua dosen (Pembimbing 1, Pembimbing 2, dan Penguji) telah menyetujui</p>
                      </div>
                    )}

                    <div className="action-buttons">
                      <button
                        className="btn-secondary"
                        onClick={() => handleVerify('rejected')}
                        disabled={verifyLoading}
                      >
                        <XCircle size={16} />
                        {verifyLoading ? 'Memproses...' : 'Tolak Seminar'}
                      </button>
                      <button
                        className="btn-primary"
                        onClick={() => handleVerify('approved')}
                        disabled={verifyLoading || (seminarDetail.approvals?.filter(a => a.status === 'approved').length < 3)}
                      >
                        <CheckCircle size={16} />
                        {verifyLoading ? 'Memproses...' : 'Setujui & Verifikasi'}
                      </button>
                    </div>
                  </div>
                ) : null
              ) : (
                <div className="detail-placeholder">
                  <div className="detail-placeholder-icon">
                    <ClipboardList size={40} />
                  </div>
                  <h3>Pilih Seminar</h3>
                  <p>Pilih seminar dari daftar untuk melihat detail dan status approval</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Verification;
