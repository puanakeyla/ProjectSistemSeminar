import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Navbar from './Navbar';
import './Seminar.css';

const Seminar = () => {
  const [seminars, setSeminars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchSeminars();
  }, []);

  const fetchSeminars = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/dosen/seminars', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSeminars(response.data.data);
    } catch (error) {
      console.error('Error fetching seminars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToDetail = (seminarId) => {
    // Dispatch custom event to App.jsx to navigate
    window.dispatchEvent(new CustomEvent('semar:navigate', {
      detail: { page: `seminar-detail-${seminarId}` }
    }));
  };

  const filteredSeminars = seminars.filter(seminar => {
    if (filter === 'all') return true;
    if (filter === 'pending') return seminar.status === 'pending' || seminar.status === 'scheduled';
    if (filter === 'revising') return seminar.status === 'revising';
    if (filter === 'approved') return seminar.status === 'approved';
    return true;
  });

  const getStatusBadge = (status, statusDisplay, statusColor) => {
    return (
      <span className={`status-badge status-${statusColor}`}>
        {statusDisplay}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const colors = {
      'Pembimbing 1': 'blue',
      'Pembimbing 2': 'purple',
      'Penguji': 'orange'
    };
    return (
      <span className={`role-badge role-${colors[role]}`}>
        {role}
      </span>
    );
  };

  return (
    <div className="dosen-seminar-page">
      <Navbar />
      
      <div className="seminar-container">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="seminar-header"
        >
          <h1>📚 Daftar Seminar</h1>
          <p>Kelola dan pantau seminar yang Anda bimbing atau uji</p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="filter-tabs"
        >
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Semua ({seminars.length})
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending ({seminars.filter(s => s.status === 'pending' || s.status === 'scheduled').length})
          </button>
          <button
            className={filter === 'revising' ? 'active' : ''}
            onClick={() => setFilter('revising')}
          >
            Revisi ({seminars.filter(s => s.status === 'revising').length})
          </button>
          <button
            className={filter === 'approved' ? 'active' : ''}
            onClick={() => setFilter('approved')}
          >
            Disetujui ({seminars.filter(s => s.status === 'approved').length})
          </button>
        </motion.div>

        {/* Seminars List */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Memuat data seminar...</p>
          </div>
        ) : filteredSeminars.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="empty-state"
          >
            <div className="empty-icon">📋</div>
            <h3>Tidak ada seminar</h3>
            <p>Belum ada seminar {filter !== 'all' ? `dengan filter ${filter}` : ''}</p>
          </motion.div>
        ) : (
          <div className="seminars-grid">
            <AnimatePresence>
              {filteredSeminars.map((seminar, index) => (
                <motion.div
                  key={seminar.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="seminar-card"
                  onClick={() => handleNavigateToDetail(seminar.id)}
                >
                  <div className="card-header">
                    <div className="card-title-row">
                      <h3>{seminar.judul}</h3>
                      {getRoleBadge(seminar.my_role)}
                    </div>
                    {getStatusBadge(seminar.status, seminar.status_display, seminar.status_color)}
                  </div>

                  <div className="card-body">
                    <div className="info-row">
                      <span className="label">👨‍🎓 Mahasiswa:</span>
                      <span className="value">{seminar.mahasiswa.name}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">📌 NPM:</span>
                      <span className="value">{seminar.mahasiswa.npm}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">📖 Jenis:</span>
                      <span className="value">{seminar.jenis_seminar_display}</span>
                    </div>

                    {seminar.schedule && (
                      <>
                        <div className="info-row">
                          <span className="label">📅 Tanggal:</span>
                          <span className="value">{seminar.schedule.formatted_date}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">🕐 Waktu:</span>
                          <span className="value">{seminar.schedule.formatted_time}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">🏢 Ruangan:</span>
                          <span className="value">{seminar.schedule.ruangan}</span>
                        </div>
                      </>
                    )}

                    {/* Revision Progress */}
                    {seminar.revision && (
                      <div className="revision-info">
                        <div className="revision-header">
                          <span className="label">📝 Progress Revisi:</span>
                          <span className="percentage">{seminar.revision.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <motion.div
                            className="progress-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${seminar.revision.progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <div className="revision-stats">
                          <span className="stat-item">
                            <span className="stat-value">{seminar.revision.approved_items}</span>
                            <span className="stat-label">Disetujui</span>
                          </span>
                          <span className="stat-divider">/</span>
                          <span className="stat-item">
                            <span className="stat-value">{seminar.revision.total_items}</span>
                            <span className="stat-label">Total Item</span>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Dosen Team */}
                    <div className="dosen-team">
                      <span className="label">👥 Tim Dosen:</span>
                      <div className="dosen-badges">
                        {seminar.pembimbing1 && (
                          <span className="dosen-badge pembimbing1">
                            P1: {seminar.pembimbing1.name}
                          </span>
                        )}
                        {seminar.pembimbing2 && (
                          <span className="dosen-badge pembimbing2">
                            P2: {seminar.pembimbing2.name}
                          </span>
                        )}
                        {seminar.penguji && (
                          <span className="dosen-badge penguji">
                            Penguji: {seminar.penguji.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button className="btn-detail">
                      Lihat Detail →
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Seminar;
