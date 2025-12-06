import { useState, useEffect } from 'react';
import './QRCode.css';
import { adminAPI } from '../../services/api';
import { Calendar, Smartphone, Loader2, RefreshCcw } from 'lucide-react';

function QRCode() {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getSchedules();
      setSchedules(data.filter(s => s.status === 'scheduled'));
    } catch (err) {
      console.error('Error fetching schedules:', err);
      alert('Gagal memuat jadwal');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async (schedule) => {
    try {
      setGeneratingQR(true);
      setSelectedSchedule(schedule);
      
      const response = await adminAPI.generateQR(schedule.id);
      setQrCode(response);
    } catch (err) {
      console.error('Error generating QR:', err);
      alert(err.response?.data?.message || 'Gagal membuat kode QR');
      setSelectedSchedule(null);
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleDownloadQR = async (schedule) => {
    try {
      const response = await adminAPI.getQRCode(schedule.id);
      
      // Create download link
      const link = document.createElement('a');
      link.href = response.qr_code_url;
      link.download = `QR_Seminar_${schedule.seminar?.mahasiswa?.npm}_${schedule.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Kode QR berhasil diunduh!');
    } catch (err) {
      console.error('Error downloading QR:', err);
      alert('Gagal mengunduh kode QR');
    }
  };

  const handleRegenerateQR = async (scheduleId) => {
    if (!window.confirm('Buat ulang kode QR? Kode QR lama tidak akan bisa digunakan.')) {
      return;
    }

    try {
      setGeneratingQR(true);
      const response = await adminAPI.regenerateQR(scheduleId);
      
      if (selectedSchedule?.id === scheduleId) {
        setQrCode(response);
      }
      
      await fetchSchedules();
      alert('Kode QR berhasil dibuat ulang!');
    } catch (err) {
      console.error('Error regenerating QR:', err);
      alert('Gagal membuat ulang kode QR');
    } finally {
      setGeneratingQR(false);
    }
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

  const isScheduleActive = (schedule) => {
    const now = new Date();
    const startTime = new Date(schedule.waktu_mulai);
    const endTime = new Date(startTime.getTime() + schedule.durasi_menit * 60000);
    
    return now >= startTime && now <= endTime;
  };

  const getScheduleStatus = (schedule) => {
    const now = new Date();
    const startTime = new Date(schedule.waktu_mulai);
    const endTime = new Date(startTime.getTime() + schedule.durasi_menit * 60000);
    
    if (now < startTime) {
      return { label: 'Belum Dimulai', class: 'upcoming', icon: '⏳' };
    } else if (now >= startTime && now <= endTime) {
      return { label: 'Sedang Berlangsung', class: 'active', icon: '🔴' };
    } else {
      return { label: 'Sudah Selesai', class: 'finished', icon: '✅' };
    }
  };

  if (loading) {
    return (
      <div className="admin-qrcode">
        <div className="loading-state">
          <div className="loading-icon">
            <Loader2 size={32} className="icon-spin" />
          </div>
          <h2>Memuat data...</h2>
          <p>Harap tunggu sebentar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-qrcode">
      {/* Header */}
      <div className="qrcode-header">
        <div className="header-content">
          <h1>Kode QR Absensi</h1>
          <p>Buat dan kelola kode QR untuk absensi seminar</p>
        </div>
        <button className="refresh-btn" onClick={fetchSchedules}>
          <RefreshCcw className="w-4 h-4" /> Segarkan
        </button>
      </div>

      <div className="qrcode-layout">
        {/* Schedules List */}
        <div className="schedules-panel">
          <div className="panel-header">
            <h2>Jadwal Seminar</h2>
            <span className="count-badge">{schedules.length}</span>
          </div>

          {schedules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Calendar size={32} /></div>
              <h2>Belum Ada Jadwal Mendatang</h2>
              <p>Coba pilih filter lain atau segarkan data</p>
            </div>
          ) : (
            <div className="schedules-list">
              {schedules.map((schedule) => {
                const status = getScheduleStatus(schedule);
                const hasQR = schedule.qr_code_path;
                
                return (
                  <div 
                    key={schedule.id}
                    className={`schedule-card ${selectedSchedule?.id === schedule.id ? 'selected' : ''}`}
                  >
                    <div className="card-header">
                      <span className={`status-indicator ${status.class}`}>
                        {status.icon} {status.label}
                      </span>
                      {hasQR && <span className="qr-indicator">✓ QR Siap</span>}
                    </div>

                    <h3>{schedule.seminar?.judul}</h3>

                    <div className="card-info">
                      <div className="info-row">
                        <span className="label">Mahasiswa:</span>
                        <span className="value">{schedule.seminar?.mahasiswa?.name}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">NPM:</span>
                        <span className="value">{schedule.seminar?.mahasiswa?.npm}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Waktu:</span>
                        <span className="value">{formatDate(schedule.waktu_mulai)}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Ruang:</span>
                        <span className="value">{schedule.ruang}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Durasi:</span>
                        <span className="value">{schedule.durasi_menit} menit</span>
                      </div>
                    </div>

                    <div className="card-actions">
                      {!hasQR ? (
                        <button
                          className="btn-generate"
                          onClick={() => handleGenerateQR(schedule)}
                          disabled={generatingQR}
                        >
                          📱 Buat QR
                        </button>
                      ) : (
                        <>
                          <button
                            className="btn-view"
                            onClick={() => {
                              setSelectedSchedule(schedule);
                              handleGenerateQR(schedule);
                            }}
                          >
                            👁️ Lihat QR
                          </button>
                          <button
                            className="btn-download"
                            onClick={() => handleDownloadQR(schedule)}
                          >
                            💾 Unduh
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* QR Display Panel */}
        <div className="qr-display-panel">
          {!selectedSchedule ? (
            <div className="no-selection">
              <div className="no-selection-icon"><Smartphone size={32} /></div>
              <h2>Pilih Jadwal</h2>
              <p>Pilih jadwal dari daftar untuk membuat atau melihat kode QR</p>
            </div>
          ) : generatingQR ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Membuat kode QR...</p>
            </div>
          ) : qrCode ? (
            <div className="qr-display">
              <div className="qr-header">
                <h2>Kode QR Absensi</h2>
                <div className="qr-status">
                  {isScheduleActive(selectedSchedule) ? (
                    <span className="active-badge">🔴 Aktif Sekarang</span>
                  ) : (
                    <span className="inactive-badge">⏸️ Belum/Sudah Tidak Aktif</span>
                  )}
                </div>
              </div>

              <div className="qr-info-box">
                <h3>{selectedSchedule.seminar?.judul}</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Mahasiswa:</span>
                    <span className="value">{selectedSchedule.seminar?.mahasiswa?.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">NPM:</span>
                    <span className="value">{selectedSchedule.seminar?.mahasiswa?.npm}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Waktu:</span>
                    <span className="value">{formatDate(selectedSchedule.waktu_mulai)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Durasi:</span>
                    <span className="value">{selectedSchedule.durasi_menit} menit</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Ruang:</span>
                    <span className="value">{selectedSchedule.ruang}</span>
                  </div>
                </div>
              </div>

              <div className="qr-code-container">
                <img 
                  src={qrCode.qr_code_url} 
                  alt="Kode QR" 
                  className="qr-code-image"
                />
                <div className="qr-code-info">
                  <p className="qr-token">Token: {qrCode.token?.substring(0, 16)}...</p>
                  <p className="qr-validity">
                    ⏰ Kode QR berlaku pada waktu seminar:<br/>
                    {formatDate(selectedSchedule.waktu_mulai)} - 
                    {new Date(new Date(selectedSchedule.waktu_mulai).getTime() + selectedSchedule.durasi_menit * 60000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="qr-actions">
                <button
                  className="btn-download-large"
                  onClick={() => handleDownloadQR(selectedSchedule)}
                >
                  💾 Unduh Kode QR
                </button>
                <button
                  className="btn-regenerate"
                  onClick={() => handleRegenerateQR(selectedSchedule.id)}
                  disabled={generatingQR}
                >
                  🔄 Generate Ulang
                </button>
              </div>

              <div className="warning-box">
                <p>⚠️ <strong>Penting:</strong></p>
                <ul>
                  <li>Kode QR hanya berlaku pada waktu seminar (toleransi ±15 menit)</li>
                  <li>Setiap seminar memiliki kode QR unik</li>
                  <li>Mahasiswa pindai kode QR untuk absensi otomatis</li>
                  <li>Buat ulang akan membuat kode QR lama tidak valid</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="error-state">
              <p>❌ Gagal memuat kode QR</p>
              <button onClick={() => handleGenerateQR(selectedSchedule)}>
                Coba Lagi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default QRCode;
