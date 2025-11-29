import { useState } from 'react';
import { authAPI } from '../../services/api';
import '../../Login.css';
import teamworkIllustration from '../../assets/logologin.jpg';

const demoCredentials = [
  { role: 'Admin', identifier: 'admin@kampus.ac.id', password: 'admin123' },
  { role: 'Mahasiswa', identifier: '2201001', password: 'mahasiswa123' },
  { role: 'Dosen 1', identifier: 'dosen1@kampus.ac.id', password: 'dosen123' },
  { role: 'Dosen 2', identifier: 'dosen2@kampus.ac.id', password: 'dosen123' },
  { role: 'Dosen 3', identifier: 'dosen3@kampus.ac.id', password: 'dosen123' }
];

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
            <span className="info-badge">SMART ATTENDANCE PLATFORM</span>
            <h1>Absensi pintar untuk kampus modern</h1>
            <p>Automasi validasi lokasi, kelola izin, dan hadirkan data kehadiran real-time.</p>
            <ul>
              <li>Integrasi cepat dengan kelas dan jadwal</li>
              <li>Verifikasi multi-faktor untuk admin dan mahasiswa</li>
              <li>Laporan kehadiran siap pakai</li>
            </ul>
          </div>
        </div>
        <div className="form-panel">
          <div className="form-header">
            <span className="portal-label">Portal Absensi Kampus</span>
            <h2>Masuk ke Sistem</h2>
            <p>Masukkan email atau NIM. Sistem akan mengenali peran Anda otomatis.</p>
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
                placeholder="CASS"
                required
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Memuat...' : 'Masuk'}
              </button>
              <button type="button" className="link-button">Lupa password?</button>
            </div>
          </form>
          <div className="demo-credentials">
            <div className="demo-header">
              <span>Kredensial Demo</span>
            </div>
            <div className="credential-list">
              {demoCredentials.map((cred) => (
                <div className="credential-item" key={cred.role}>
                  <div>
                    <p className="credential-role">{cred.role}</p>
                    <p className="credential-identifier">{cred.identifier}</p>
                  </div>
                  <span className="credential-password">{cred.password}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <footer className="login-footer">© 2025 Sistem Absensi Kampus</footer>
    </div>
  );
}

export default Login;
