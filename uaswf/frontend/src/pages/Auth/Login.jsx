import { useState } from 'react';
import '../../Login.css';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt:', { email, password });
    // Validasi login
    if (email.toLowerCase() === 'cindy' && password === '12345') {
      onLogin();
    } else {
      alert('Username atau password salah!\nUsername: cindy\nPassword: 12345');
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
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="masukkan username"
              required
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
            />
          </div>
          <button type="submit" className="btn-submit">Masuk</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
