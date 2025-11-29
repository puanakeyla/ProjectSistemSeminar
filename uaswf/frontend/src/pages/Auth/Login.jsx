import { useState } from 'react';
import { authAPI } from '../../services/api';
import '../../Login.css';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

}
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <div className="login-header">
          <h2>Login</h2>
          <p style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '10px' }}>
            Sistem Informasi Seminar
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
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="masukkan email"
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
              placeholder="masukkan password"
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Loading...' : 'Masuk'}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Login;
