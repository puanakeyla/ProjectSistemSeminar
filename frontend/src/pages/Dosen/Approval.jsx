import { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck,
  Loader2,
  AlertTriangle,
  Inbox,
  ClipboardList,
  UserRound,
  CalendarDays,
  FileText,
  AlignLeft,
  CalendarClock,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
} from 'lucide-react';
import { dosenAPI } from '../../services/api';
import './Approval.css';

function Approval() {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  const filterOptions = useMemo(
    () => [
      { id: 'all', label: 'Semua' },
      { id: 'pembimbing1', label: 'Pembimbing 1' },
      { id: 'pembimbing2', label: 'Pembimbing 2' },
      { id: 'penguji', label: 'Penguji' },
    ],
    []
  );

  const normalizeRole = (role) => {
    const value = (role || '').toLowerCase();
    if (value.includes('penguji')) return 'penguji';
    if (value.includes('pembimbing 2') || value.includes('pembimbing2')) return 'pembimbing2';
    if (value.includes('pembimbing')) return 'pembimbing1';
    return null;
  };

  const approvalCounts = useMemo(() => {
    return pendingApprovals.reduce(
      (acc, approval) => {
        const roleKey = normalizeRole(approval?.peran);
        if (roleKey && acc[roleKey] !== undefined) {
          acc[roleKey] += 1;
        }
        return acc;
      },
      { pembimbing1: 0, pembimbing2: 0, penguji: 0 }
    );
  }, [pendingApprovals]);

  const filteredApprovals = useMemo(() => {
    if (activeFilter === 'all') {
      return pendingApprovals;
    }

    return pendingApprovals.filter((approval) => normalizeRole(approval?.peran) === activeFilter);
  }, [pendingApprovals, activeFilter]);

  // Fetch pending approvals on mount
  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  // Reset detail panel if current selection no longer available in active filter
  useEffect(() => {
    if (selectedApproval && !filteredApprovals.some((item) => item.id === selectedApproval.id)) {
      setSelectedApproval(null);
      setShowDatePicker(false);
      setSelectedDates([]);
      setCatatan('');
    }
  }, [filteredApprovals, selectedApproval]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dosenAPI.getPendingApprovals();
      
      // Backend Laravel return { message, data: [...] }
      const approvalsList = response?.data?.data || response?.data || response || [];
      setPendingApprovals(Array.isArray(approvalsList) ? approvalsList : []);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
      setError('Gagal memuat data persetujuan. Silakan coba lagi.');
      setPendingApprovals([]);
    } finally {
      setLoading(false);
    }
  };

  const getTipeColor = (tipe) => {
    const colors = {
      proposal: '#2563eb',
      hasil: '#f59e0b',
      komprehensif: '#8b5cf6',
      kompre: '#8b5cf6',
    };
    return colors[(tipe || '').toLowerCase()] || '#64748b';
  };

  const handleApprovalClick = (approval) => {
    setSelectedApproval(approval);
    setSelectedDates([]);
    setCatatan('');
    setShowDatePicker(false);
  };

  const handleDateSelect = (date) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(selectedDates.filter(d => d !== date));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleApprove = async () => {
    if (selectedDates.length === 0) {
      alert('Silakan pilih minimal 1 tanggal ketersediaan Anda');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await dosenAPI.updateApproval(selectedApproval.id, {
        status: 'approved',
        available_dates: selectedDates,
        catatan: catatan || null
      });
      
      alert(response.message || 'Persetujuan berhasil!');
      
      // Refresh data
      await fetchPendingApprovals();
      
      // Reset form
      setSelectedApproval(null);
      setShowDatePicker(false);
      setSelectedDates([]);
      setCatatan('');
    } catch (err) {
      console.error('Failed to approve:', err);
      const errorMsg = err.response?.data?.message || 'Gagal menyetujui. Silakan coba lagi.';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    // Prompt for rejection reason if not provided
    let rejectionReason = catatan.trim();
    
    if (!rejectionReason) {
      rejectionReason = prompt('Alasan Penolakan (wajib diisi):');
      if (!rejectionReason || !rejectionReason.trim()) {
        alert('Alasan penolakan harus diisi!');
        return;
      }
    }

    if (!window.confirm('Yakin ingin menolak pengajuan ini?')) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await dosenAPI.updateApproval(selectedApproval.id, {
        status: 'rejected',
        catatan: rejectionReason
      });

      alert(response.message || 'Pengajuan berhasil ditolak');
      
      // Refresh data
      await fetchPendingApprovals();
      
      // Reset form
      setSelectedApproval(null);
      setCatatan('');
    } catch (err) {
      console.error('Failed to reject:', err);
      const errorMsg = err.response?.data?.message || 'Gagal menolak pengajuan. Silakan coba lagi.';
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewPdf = async (seminarId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/dosen/seminars/${seminarId}/file/view`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Gagal memuat file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error viewing PDF:', error);
      alert('Gagal membuka PDF. Silakan coba lagi.');
    }
  };

  const handleDownloadPdf = async (seminarId, mahasiswaNama) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/dosen/seminars/${seminarId}/file/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Gagal mengunduh file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seminar_${mahasiswaNama}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Gagal mengunduh PDF. Silakan coba lagi.');
    }
  };

  // Generate next 30 days for date picker
  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toLocaleDateString('id-ID', { 
        weekday: 'short', 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
      dates.push({
        value: date.toISOString().split('T')[0],
        label: dateStr,
        dayName: date.toLocaleDateString('id-ID', { weekday: 'long' })
      });
    }
    return dates;
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

  const formatDateDisplay = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const dateOptions = generateDateOptions();
  const selectedMahasiswaName = selectedApproval?.mahasiswa ?? selectedApproval?.mahasiswa_name ?? 'Mahasiswa';
  const selectedMahasiswaNpm = selectedApproval?.npm ?? selectedApproval?.mahasiswa_npm ?? '-';
  const selectedTanggalPengajuan = formatDateDisplay(
    selectedApproval?.tanggal_pengajuan ?? selectedApproval?.created_at
  );
  const selectedPeranDisplay = formatTitleCase(selectedApproval?.peran);
  const selectedSeminarType = selectedApproval
    ? formatTitleCase(selectedApproval.tipe || selectedApproval.jenis_seminar)
    : '-';
  const selectedSeminarBadge = selectedSeminarType === '-' ? '-' : `Seminar ${selectedSeminarType}`;

  if (loading) {
    return (
      <div className="approval-page">
        <div className="approval-card">
          <div className="approval-state">
            <div className="approval-state-icon">
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
      <div className="approval-page">
        <div className="approval-card">
          <div className="approval-state">
            <div className="approval-state-icon error">
              <AlertTriangle size={32} />
            </div>
            <h2>Terjadi Kesalahan</h2>
            <p>{error}</p>
            <button type="button" className="approval-retry-btn" onClick={fetchPendingApprovals}>
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="approval-page">
      <div className="approval-card">
        <div className="approval-hero">
          <div className="approval-hero-text">
            <div className="approval-hero-title">
              <div className="approval-hero-icon">
                <ClipboardCheck size={24} />
              </div>
              <div>
                <p className="approval-hero-subtitle">Kelola persetujuan seminar mahasiswa bimbingan Anda</p>
                <h1>Persetujuan Seminar</h1>
              </div>
            </div>
          </div>
          <div className="approval-hero-badge">
            <span className="approval-hero-badge-count">{pendingApprovals.length}</span>
            <span className="approval-hero-badge-label">Menunggu</span>
          </div>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="approval-empty">
            <div className="approval-empty-icon">
              <CheckCircle2 size={36} />
            </div>
            <h2>Tidak Ada Persetujuan Menunggu</h2>
            <p>Semua pengajuan seminar sudah Anda proses dengan baik.</p>
          </div>
        ) : (
          <>
            <div className="approvals-section">
              <div className="approval-filter">
                {filterOptions.map((option) => {
                  const count =
                    option.id === 'all'
                      ? pendingApprovals.length
                      : approvalCounts[option.id] || 0;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={`approval-filter-btn ${activeFilter === option.id ? 'active' : ''}`}
                      onClick={() => setActiveFilter(option.id)}
                    >
                      <span>{option.label}</span>
                      <span className="approval-filter-count">{count}</span>
                    </button>
                  );
                })}
              </div>

              {filteredApprovals.length === 0 ? (
                <div className="approval-empty-list">
                  <div className="approval-empty-icon">
                    <Inbox size={28} />
                  </div>
                  <h3>Tidak ada pengajuan pada filter ini</h3>
                  <p>Coba pilih filter lain untuk melihat pengajuan lainnya.</p>
                </div>
              ) : (
                <div className="approvals-grid">
                  {filteredApprovals.map((approval) => {
                    const mahasiswaName = approval.mahasiswa ?? approval.mahasiswa_name ?? 'Mahasiswa';
                    const mahasiswaNpm = approval.npm ?? approval.mahasiswa_npm ?? '-';
                    const peranDisplay = formatTitleCase(approval.peran);
                    const seminarType = formatTitleCase(approval.tipe || approval.jenis_seminar);
                    const tanggalPengajuan = formatDateDisplay(
                      approval.tanggal_pengajuan ?? approval.created_at
                    );

                    return (
                      <button
                        type="button"
                        key={approval.id}
                        className={`approval-item ${selectedApproval?.id === approval.id ? 'selected' : ''}`}
                        onClick={() => handleApprovalClick(approval)}
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
                            style={{ backgroundColor: getTipeColor(approval.tipe || approval.jenis_seminar) }}
                          >
                            {seminarType}
                          </span>
                        </div>

                        <h3 className="approval-title">{approval.judul}</h3>

                        <div className="approval-meta">
                          <span className="meta-item">
                            <span className="meta-icon" aria-hidden="true">
                              <UserRound size={14} />
                            </span>
                            {peranDisplay}
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
              )}
            </div>

            <div className="detail-panel detail-panel--stacked">
              {selectedApproval ? (
                <div className="detail-content">
                  <div className="detail-header">
                    <div className="detail-header-title">
                      <ClipboardList size={20} />
                      <div>
                        <p>Detail Pengajuan</p>
                        <h2>{selectedMahasiswaName}</h2>
                      </div>
                    </div>
                    <span
                      className="tipe-badge-large"
                      style={{ backgroundColor: getTipeColor(selectedApproval.tipe || selectedApproval.jenis_seminar) }}
                    >
                      {selectedSeminarBadge}
                    </span>
                  </div>

                  <div className="detail-section">
                    <h3>
                      <span className="section-icon" aria-hidden="true">
                        <UserRound size={16} />
                      </span>
                      Informasi Mahasiswa
                    </h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Nama Lengkap</span>
                        <span className="info-value">{selectedMahasiswaName}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">NPM</span>
                        <span className="info-value">{selectedMahasiswaNpm}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Peran Anda</span>
                        <span className="info-value">{selectedPeranDisplay}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Tanggal Pengajuan</span>
                        <span className="info-value">{selectedTanggalPengajuan}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>
                      <span className="section-icon" aria-hidden="true">
                        <FileText size={16} />
                      </span>
                      Judul Seminar
                    </h3>
                    <p className="judul-text">{selectedApproval.judul}</p>
                  </div>

                  {selectedApproval.abstrak && (
                    <div className="detail-section">
                      <h3>
                        <span className="section-icon" aria-hidden="true">
                          <AlignLeft size={16} />
                        </span>
                        Abstrak
                      </h3>
                      <p className="abstrak-text">{selectedApproval.abstrak}</p>
                    </div>
                  )}

                  {selectedApproval.file_berkas && (
                    <div className="detail-section">
                      <h3>
                        <span className="section-icon" aria-hidden="true">
                          <FileText size={16} />
                        </span>
                        Dokumen Pendukung
                      </h3>
                      <div className="pdf-preview-container">
                        <div className="pdf-info">
                          <div className="pdf-icon">
                            <FileText size={28} />
                          </div>
                          <div className="pdf-details">
                            <p className="pdf-filename">
                              {selectedApproval.file_berkas.split('/').pop()}
                            </p>
                            <p className="pdf-label">Dokumen Seminar (PDF)</p>
                          </div>
                        </div>
                        <div className="pdf-actions">
                          <button
                            onClick={() => handleViewPdf(selectedApproval.seminar_id)}
                            className="pdf-btn pdf-btn--view"
                          >
                            <ExternalLink size={16} />
                            Lihat
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(selectedApproval.seminar_id, selectedMahasiswaName)}
                            className="pdf-btn pdf-btn--download"
                          >
                            <Download size={16} />
                            Unduh
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="detail-section date-picker-section">
                    <div className="section-header-action">
                      <h3>
                        <span className="section-icon" aria-hidden="true">
                          <CalendarClock size={16} />
                        </span>
                        Ketersediaan Waktu Anda
                      </h3>
                      <button
                        className="btn-toggle-dates"
                        onClick={() => setShowDatePicker(!showDatePicker)}
                      >
                        {showDatePicker ? 'Sembunyikan Kalender' : 'Pilih Tanggal Tersedia'}
                      </button>
                    </div>

                    {showDatePicker && (
                      <div className="date-picker-container">
                        <p className="date-picker-info">
                          Pilih tanggal-tanggal Anda tersedia untuk ujian seminar ini. Admin akan mencocokkan dengan
                          ketersediaan dosen lain.
                        </p>

                        <div className="selected-dates-summary">
                          <strong>Tanggal Terpilih ({selectedDates.length}):</strong>
                          {selectedDates.length > 0 ? (
                            <div className="selected-dates-list">
                              {selectedDates.map((date) => (
                                <span key={date} className="selected-date-chip">
                                  {dateOptions.find((d) => d.value === date)?.label}
                                  <button onClick={() => handleDateSelect(date)} aria-label="Hapus tanggal">
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="no-dates">Belum ada tanggal dipilih</span>
                          )}
                        </div>

                        <div className="dates-grid">
                          {dateOptions.map((date) => (
                            <button
                              key={date.value}
                              className={`date-option ${selectedDates.includes(date.value) ? 'selected' : ''}`}
                              onClick={() => handleDateSelect(date.value)}
                            >
                              <span className="date-day">{date.dayName}</span>
                              <span className="date-label">{date.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="detail-section">
                    <h3>
                      <span className="section-icon" aria-hidden="true">
                        <MessageSquare size={16} />
                      </span>
                      Catatan (Opsional)
                    </h3>
                    <textarea
                      className="catatan-input"
                      placeholder="Tambahkan catatan, saran, atau masukan untuk mahasiswa (opsional)..."
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="approval-actions">
                    <button
                      type="button"
                      className="approval-btn approval-btn--reject"
                      onClick={handleReject}
                      disabled={submitting}
                    >
                      <XCircle size={18} />
                      {submitting ? 'Memproses...' : 'Tolak Pengajuan'}
                    </button>
                    <button
                      type="button"
                      className="approval-btn approval-btn--approve"
                      onClick={handleApprove}
                      disabled={submitting}
                    >
                      <CheckCircle2 size={18} />
                      {submitting ? 'Memproses...' : 'Setujui & Kirim Tanggal'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-selection">
                  <div className="no-selection-icon">
                    <ClipboardList size={32} />
                  </div>
                  <h3>Pilih Pengajuan</h3>
                  <p>Klik salah satu pengajuan di atas untuk melihat detail dan memberikan persetujuan.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Approval;
