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
    <div className="login-wrapper">
      <div className="login-illustration">
        <img src={teamworkIllustration} alt="Ilustrasi Teamwork" />
      </div>
      <div className="login-box">
        <div className="login-header">
          <div className="semar-logo">
            <div className="logo-icon">🎓</div>
            <h1 className="logo-text">SEMAR</h1>
          </div>
          <h2>Masuk ke Akun Anda</h2>
          <p style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '10px' }}>
            Sistem Informasi Seminar Elektro
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: '10px',
              marginBottom: '15px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          <div className="input-group">
            <label>Alamat Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan alamat email Anda"
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
            {loading ? 'Memuat...' : 'Masuk'}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Login;
