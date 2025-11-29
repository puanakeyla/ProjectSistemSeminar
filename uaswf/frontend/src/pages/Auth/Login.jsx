import { useState } from 'react';
import { authAPI } from '../../services/api';
import '../../Login.css';
import teamworkIllustration from '../../assets/logologin.jpg';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(email, password);

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      onLogin(response.user);

      alert(`Login berhasil! Selamat datang, ${response.user.name}`);
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.message || 'Email atau kata sandi salah!';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="info-panel">
          <div className="info-illustration">
            <img src={teamworkIllustration} alt="Ilustrasi Teamwork" />
          </div>
          <div className="info-copy">
            <span className="info-badge">SISTEM PENGELOLAAN SEMINAR ELEKTRO</span>
            <h1>SEMAR - Platform Seminar Digital Terintegrasi</h1>
            <p>Sistem informasi modern untuk mengelola pengajuan, penjadwalan, dan dokumentasi seminar mahasiswa secara efisien dan terstruktur.</p>
            <ul>
              <li>Pengajuan seminar online dengan approval multi-level</li>
              <li>Penjadwalan otomatis dengan notifikasi real-time</li>
              <li>Manajemen revisi dan dokumentasi tersentralisasi</li>
              <li>QR Code absensi dan laporan kehadiran digital</li>
            </ul>
          </div>
        </div>
        <div className="form-panel">
          <div className="form-header">
            <span className="portal-label">Portal SEMAR - Teknik Elektro</span>
            <h2>Masuk ke Sistem</h2>
            <p>Masukkan email atau NIM untuk mengakses sistem pengelolaan seminar.</p>
          </div>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error-banner">
                {error}
              </div>
            )}
            <div className="input-group">
              <label>Email / NIM</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email atau NIM Anda"
                required
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label>Kata Sandi</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi Anda"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Memuat...' : 'Masuk ke Sistem'}
            </button>
          </form>
        </div>
      </div>
      <footer className="login-footer">© 2025 SEMAR - Sistem Pengelolaan Seminar Elektro Universitas Lampung</footer>
    </div>
  );
}

export default Login;
