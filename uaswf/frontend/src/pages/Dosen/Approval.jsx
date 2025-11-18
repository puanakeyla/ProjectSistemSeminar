import { useState, useEffect } from 'react';
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

  // Fetch pending approvals on mount
  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dosenAPI.getPendingApprovals();
      setPendingApprovals(response.data || []);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
      setError('Gagal memuat data persetujuan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const dummyPendingApprovals = [
    {
      id: 1,
      mahasiswa: 'Ahmad Fauzi',
      npm: '2155051001',
      judul: 'Implementasi Machine Learning untuk Prediksi Cuaca',
      abstrak: 'Penelitian ini membahas tentang implementasi algoritma machine learning untuk memprediksi pola cuaca berdasarkan data historis. Menggunakan metode Random Forest dan Neural Network untuk analisis prediksi...',
      tipe: 'Proposal',
      tanggal_pengajuan: '20 Jan 2025',
      peran: 'Pembimbing 1',
      status: 'pending'
    },
    {
      id: 2,
      mahasiswa: 'Siti Nurhaliza',
      npm: '2155051002',
      judul: 'Sistem Informasi Manajemen Perpustakaan Berbasis Web',
      abstrak: 'Pengembangan sistem informasi perpustakaan menggunakan framework Laravel dan React. Sistem ini dirancang untuk mempermudah pengelolaan buku, peminjaman, dan administrasi perpustakaan...',
      tipe: 'Hasil',
      tanggal_pengajuan: '19 Jan 2025',
      peran: 'Pembimbing 2',
      status: 'pending'
    },
    {
      id: 3,
      mahasiswa: 'Budi Santoso',
      npm: '2155051003',
      judul: 'Analisis Kinerja Algoritma Sorting pada Big Data',
      abstrak: 'Melakukan perbandingan kinerja berbagai algoritma sorting (Quick Sort, Merge Sort, Heap Sort) dalam menangani dataset besar. Menggunakan metode benchmark untuk mengukur efisiensi waktu dan memori...',
      tipe: 'Komprehensif',
      tanggal_pengajuan: '18 Jan 2025',
      peran: 'Penguji',
      status: 'pending'
    },
    {
      id: 4,
      mahasiswa: 'Dewi Kusuma',
      npm: '2155051004',
      judul: 'Aplikasi Mobile E-Commerce dengan Flutter',
      abstrak: 'Pengembangan aplikasi e-commerce berbasis mobile menggunakan Flutter dan Firebase. Aplikasi ini mencakup fitur katalog produk, keranjang belanja, payment gateway, dan tracking pesanan...',
      tipe: 'Proposal',
      tanggal_pengajuan: '17 Jan 2025',
      peran: 'Pembimbing 1',
      status: 'pending'
    },
    {
      id: 5,
      mahasiswa: 'Rizky Pratama',
      npm: '2155051005',
      judul: 'Sistem Keamanan Jaringan Menggunakan Intrusion Detection System',
      abstrak: 'Implementasi sistem deteksi intrusi pada jaringan komputer menggunakan teknik machine learning. Sistem ini mampu mendeteksi anomali dan serangan jaringan secara real-time...',
      tipe: 'Hasil',
      tanggal_pengajuan: '16 Jan 2025',
      peran: 'Penguji',
      status: 'pending'
    }
  ];

  const getTipeColor = (tipe) => {
    const colors = {
      'Proposal': '#3B82F6',
      'Hasil': '#F59E0B',
      'Komprehensif': '#8B5CF6'
    };
    return colors[tipe] || '#6B7280';
  };

  const handleApprovalClick = (approval) => {
    setSelectedApproval(approval);
    setSelectedDates([]);
    setCatatan('');
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

  const dateOptions = generateDateOptions();

  if (loading) {
    return (
      <div className="approval-page">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>Memuat data...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="approval-page">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h2>Terjadi Kesalahan</h2>
          <p style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</p>
          <button onClick={fetchPendingApprovals} style={{ padding: '12px 24px', background: '#4E8EA2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="approval-page">
      <div className="approval-header">
        <div>
          <h1>Persetujuan Seminar</h1>
          <p>Kelola persetujuan seminar mahasiswa bimbingan Anda</p>
        </div>
        <div className="approval-stats">
          <div className="stat-badge pending">
            <span className="stat-number">{pendingApprovals.length}</span>
            <span className="stat-label">Menunggu</span>
          </div>
        </div>
      </div>

      {pendingApprovals.length === 0 ? (
        <div style={{ background: 'white', padding: '60px 20px', borderRadius: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '80px', marginBottom: '20px', opacity: 0.5 }}>✅</div>
          <h2 style={{ color: '#64748b', marginBottom: '12px' }}>Tidak Ada Persetujuan Menunggu</h2>
          <p style={{ color: '#94a3b8' }}>Semua pengajuan seminar sudah Anda proses</p>
        </div>
      ) : (
        <div className="approval-layout">
          {/* List Approvals */}
          <div className="approvals-container">
            <div className="approvals-filter">
              <button className="filter-btn active">Semua ({pendingApprovals.length})</button>
              <button className="filter-btn">Pembimbing 1</button>
              <button className="filter-btn">Pembimbing 2</button>
              <button className="filter-btn">Penguji</button>
            </div>

            <div className="approvals-grid">
              {pendingApprovals.map((approval) => (
              <div 
                key={approval.id} 
                className={`approval-item ${selectedApproval?.id === approval.id ? 'selected' : ''}`}
                onClick={() => handleApprovalClick(approval)}
              >
                <div className="approval-item-header">
                  <div className="student-badge">
                    <div className="student-avatar">
                      {approval.mahasiswa.charAt(0)}
                    </div>
                    <div className="student-info">
                      <h4>{approval.mahasiswa}</h4>
                      <span className="npm">{approval.npm}</span>
                    </div>
                  </div>
                  <span className="tipe-badge" style={{ backgroundColor: getTipeColor(approval.tipe) }}>
                    {approval.tipe}
                  </span>
                </div>

                <h3 className="approval-title">{approval.judul}</h3>
                
                <div className="approval-meta">
                  <span className="meta-item">
                    <span className="meta-icon">👤</span>
                    Peran: {approval.peran}
                  </span>
                  <span className="meta-item">
                    <span className="meta-icon">📅</span>
                    {approval.tanggal_pengajuan}
                  </span>
                </div>

                {selectedApproval?.id === approval.id && (
                  <div className="selected-indicator">✓ Dipilih</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="detail-panel">
          {selectedApproval ? (
            <div className="detail-content">
              <div className="detail-header">
                <h2>Detail Pengajuan</h2>
                <span className="tipe-badge-large" style={{ backgroundColor: getTipeColor(selectedApproval.tipe) }}>
                  Seminar {selectedApproval.tipe}
                </span>
              </div>

              <div className="detail-section">
                <h3>Informasi Mahasiswa</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Nama</span>
                    <span className="info-value">{selectedApproval.mahasiswa}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">NPM</span>
                    <span className="info-value">{selectedApproval.npm}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Peran Anda</span>
                    <span className="info-value">{selectedApproval.peran}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Tanggal Pengajuan</span>
                    <span className="info-value">{selectedApproval.tanggal_pengajuan}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Judul Seminar</h3>
                <p className="judul-text">{selectedApproval.judul}</p>
              </div>

              <div className="detail-section">
                <h3>Abstrak</h3>
                <p className="abstrak-text">{selectedApproval.abstrak}</p>
              </div>

              {/* Date Picker Section */}
              <div className="detail-section date-picker-section">
                <div className="section-header-action">
                  <h3>Ketersediaan Anda</h3>
                  <button 
                    className="btn-toggle-dates"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  >
                    {showDatePicker ? '▲ Sembunyikan' : '▼ Pilih Tanggal'}
                  </button>
                </div>
                
                {showDatePicker && (
                  <div className="date-picker-container">
                    <p className="date-picker-info">
                      📅 Pilih tanggal-tanggal Anda tersedia untuk ujian seminar ini.
                      Admin akan mencocokkan dengan ketersediaan dosen lain.
                    </p>
                    
                    <div className="selected-dates-summary">
                      <strong>Tanggal Terpilih ({selectedDates.length}):</strong>
                      {selectedDates.length > 0 ? (
                        <div className="selected-dates-list">
                          {selectedDates.map(date => (
                            <span key={date} className="selected-date-chip">
                              {dateOptions.find(d => d.value === date)?.label}
                              <button onClick={() => handleDateSelect(date)}>×</button>
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

              {/* Catatan */}
              <div className="detail-section">
                <h3>Catatan (Opsional)</h3>
                <textarea
                  className="catatan-input"
                  placeholder="Tambahkan catatan atau saran untuk mahasiswa..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button className="btn-reject" onClick={handleReject}>
                  <span>❌</span> Tolak
                </button>
                <button className="btn-approve" onClick={handleApprove}>
                  <span>✓</span> Setujui & Kirim Tanggal
                </button>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <div className="no-selection-icon">📋</div>
              <h3>Pilih Pengajuan</h3>
              <p>Klik pada salah satu pengajuan di sebelah kiri untuk melihat detail dan memberikan persetujuan</p>
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
}

export default Approval;
