import { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import './ScanQR.css';
import { QrCode, Camera, XCircle, RefreshCw, CheckCircle, ClipboardList, AlertTriangle } from 'lucide-react'

const API_URL = 'http://localhost:8000/api';

function ScanQR() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (scanning && !scannerRef.current) {
      startScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error('Error clearing scanner:', err));
        scannerRef.current = null;
      }
    };
  }, [scanning]);

  const startScanner = () => {
    const scanner = new Html5QrcodeScanner('qr-reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    scanner.render(onScanSuccess, onScanError);
    scannerRef.current = scanner;
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    console.log('QR Code detected:', decodedText);

    // Stop scanning
    if (scannerRef.current) {
      await scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);

    // Validate QR with backend
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/mahasiswa/attendance/scan-qr`,
        { qr_token: decodedText },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      setResult({
        success: true,
        message: response.data.message || 'Absensi berhasil dicatat!',
        data: response.data.data
      });
      setError('');
    } catch (err) {
      console.error('QR Validation error:', err);
      setError(err.response?.data?.message || 'Kode QR tidak valid atau sudah kadaluarsa');
      setResult(null);
    }
  };

  const onScanError = (errorMessage) => {
    // Ignore common scanning errors
    if (!errorMessage.includes('NotFoundException')) {
      console.warn('Scan error:', errorMessage);
    }
  };

  const handleStartScan = () => {
    setScanning(true);
    setResult(null);
    setError('');
  };

  const handleStopScan = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(err => console.error('Error clearing scanner:', err));
      scannerRef.current = null;
    }
    setScanning(false);
  };

  return (
    <div className="scan-qr-wrapper">
      <div className="scan-qr-header">
        <h1>Pindai Kode QR Absensi</h1>
        <p>Pindai kode QR yang ditampilkan saat seminar berlangsung</p>
      </div>

      <div className="scan-qr-content">
        {!scanning && !result && (
          <div className="scan-info-card">
            <div className="scan-icon"><QrCode className="w-12 h-12" /></div>
            <h3>Cara Menggunakan</h3>
            <ol>
              <li>Pastikan Anda berada di ruangan seminar</li>
              <li>Klik tombol "Mulai Pindai" di bawah</li>
              <li>Arahkan kamera ke kode QR yang ditampilkan</li>
              <li>Tunggu hingga kode QR terdeteksi otomatis</li>
              <li>Absensi Anda akan tercatat jika kode QR valid</li>
            </ol>
            <button className="btn-start-scan" onClick={handleStartScan}>
              <Camera className="w-4 h-4 mr-2 inline" /> Mulai Pindai Kode QR
            </button>
          </div>
        )}

        {scanning && (
          <div className="scanner-container">
            <div className="scanner-box">
              <div id="qr-reader"></div>
            </div>
            <p className="scanner-hint">Arahkan kamera ke kode QR</p>
            <button className="btn-stop-scan" onClick={handleStopScan}>
              <XCircle className="w-4 h-4 mr-2 inline" /> Batal
            </button>
          </div>
        )}

        {error && (
          <div className="result-card error">
            <div className="result-icon"><XCircle className="w-8 h-8 text-danger" /></div>
            <h3>Pemindaian Gagal</h3>
            <p>{error}</p>
            <div className="result-actions">
              <button className="btn-retry" onClick={handleStartScan}>
                <RefreshCw className="w-4 h-4 mr-2 inline" /> Pindai Ulang
              </button>
            </div>
          </div>
        )}

        {result && result.success && (
          <div className="result-card success">
            <div className="result-icon"><CheckCircle className="w-8 h-8 text-success" /></div>
            <h3>Absensi Berhasil!</h3>
            <p>{result.message}</p>

            {result.data && (
              <div className="result-details">
                <div className="detail-item">
                  <span className="label">Seminar:</span>
                  <span className="value">{result.data.seminar_title}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Waktu Absen:</span>
                  <span className="value">{result.data.waktu_absen}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Ruangan:</span>
                  <span className="value">{result.data.ruangan}</span>
                </div>
              </div>
            )}

            <div className="result-actions">
              <button className="btn-done" onClick={() => window.location.href = '/mahasiswa/daftarhadir'}>
                <ClipboardList className="w-4 h-4 mr-2 inline" /> Lihat Riwayat Kehadiran
              </button>
              <button className="btn-scan-again" onClick={() => {
                setResult(null);
                setError('');
              }}>
                Pindai Kode QR Lain
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="scan-qr-footer">
        <div className="info-box">
          <h4><AlertTriangle className="w-5 h-5 inline mr-2 text-warning" /> Penting!</h4>
          <ul>
            <li>Kode QR hanya berlaku pada waktu seminar (±15 menit dari jadwal)</li>
            <li>Pastikan koneksi internet Anda stabil</li>
            <li>Izinkan akses kamera saat diminta browser</li>
            <li>Gunakan pencahayaan yang cukup untuk hasil pindai terbaik</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ScanQR;
