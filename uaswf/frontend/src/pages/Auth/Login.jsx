import { useState } from 'react';
import '../../Login.css';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // DAFTAR USER - BISA LOGIN SEMUA
    const users = [
      { username: 'cindy', password: '12345', name: 'Cindy' },
      { username: 'santi', password: '67890', name: 'Santi' },
      { username: 'putri', password: 'abcde', name: 'Putri' },
      { username: 'puan', password: 'puan123', name: 'Puan Maharani' },
      { username: 'admin', password: 'admin123', name: 'Administrator' },
      { username: 'user1', password: 'user123', name: 'User Satu' },
      { username: 'user2', password: 'user456', name: 'User Dua' }
    ];

    const foundUser = users.find(
      user => user.username === email.toLowerCase() && user.password === password
    );

    if (foundUser) {
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      onLogin(foundUser);
      alert(`Login berhasil! Selamat datang, ${foundUser.name}`);
    } else {
      alert('Username atau password salah!');
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