import { useState, useEffect } from 'react';
import { dosenAPI } from '../../services/api';
import { CheckCircle, Clock, MapPin, Calendar, User, Loader2, AlertCircle, XCircle } from 'lucide-react';
import './CheckIn.css';

function CheckIn() {
  const [seminars, setSeminars] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [seminarsRes, historyRes] = await Promise.all([
        dosenAPI.getMySeminars('all'),
        dosenAPI.getAttendanceHistory()
      ]);

      const seminarsList = seminarsRes?.data?.data || seminarsRes?.data || [];
      const historyList = historyRes?.data?.attendances || historyRes?.data || [];

      // Filter seminars with schedule
      const scheduled = Array.isArray(seminarsList)
        ? seminarsList.filter(s => s.schedule && s.schedule.id)
        : [];

      setSeminars(scheduled);
      setAttendanceHistory(Array.isArray(historyList) ? historyList : []);
    } catch (err) {
      console.error('Error loading check-in data:', err);
      alert('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (seminar) => {
    if (!seminar.schedule || !seminar.schedule.id) {
      alert('Seminar belum dijadwalkan');
      return;
    }

    const alreadyCheckedIn = attendanceHistory.some(
      h => h.seminar_title === seminar.judul
    );

    if (alreadyCheckedIn) {
      alert('Anda sudah check-in untuk seminar ini');
      return;
    }

    try {
      setCheckingIn(seminar.id);
      const response = await dosenAPI.checkIn({
        seminar_schedule_id: seminar.schedule.id
      });

      alert(response.message || 'Check-in berhasil!');
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Check-in error:', err);
      alert(err.response?.data?.message || 'Gagal check-in');
    } finally {
      setCheckingIn(null);
    }
  };

  const isCheckedIn = (seminar) => {
    return attendanceHistory.some(h => h.seminar_title === seminar.judul);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="checkin-wrapper">
        <div className="loading-state">
          <Loader2 size={32} className="icon-spin" />
          <h2>Memuat data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="checkin-wrapper">
      <div className="checkin-header">
        <h1>Check-In Seminar</h1>
        <p>Catat kehadiran Anda sebagai dosen pembimbing/penguji</p>
      </div>

      <div className="checkin-content">
        {/* Upcoming Seminars */}
        <div className="section">
          <h2 className="section-title">Seminar yang Perlu Check-In</h2>

          {seminars.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={32} />
              <h3>Tidak Ada Jadwal Seminar</h3>
              <p>Belum ada seminar yang terjadwal</p>
            </div>
          ) : (
            <div className="seminar-grid">
              {seminars.map((seminar) => {
                const checkedIn = isCheckedIn(seminar);
                const schedule = seminar.schedule;

                return (
                  <div key={seminar.id} className={`seminar-card ${checkedIn ? 'checked-in' : ''}`}>
                    <div className="card-header">
                      <h3>{seminar.judul}</h3>
                      {checkedIn && (
                        <span className="badge-checked">
                          <CheckCircle size={16} /> Check-in
                        </span>
                      )}
                    </div>

                    <div className="card-body">
                      <div className="info-row">
                        <User size={16} />
                        <span>{seminar.mahasiswa?.name || '-'}</span>
                      </div>
                      <div className="info-row">
                        <Calendar size={16} />
                        <span>{schedule?.formatted_date || formatDate(schedule?.tanggal) || '-'}</span>
                      </div>
                      <div className="info-row">
                        <Clock size={16} />
                        <span>{schedule?.formatted_time || '-'}</span>
                      </div>
                      <div className="info-row">
                        <MapPin size={16} />
                        <span>{schedule?.ruangan || '-'}</span>
                      </div>
                      <div className="info-row role-badge">
                        <span className="badge">{seminar.my_role || 'Dosen'}</span>
                      </div>
                    </div>

                    <div className="card-footer">
                      {!checkedIn ? (
                        <button
                          className="btn-checkin"
                          onClick={() => handleCheckIn(seminar)}
                          disabled={checkingIn === seminar.id}
                        >
                          {checkingIn === seminar.id ? (
                            <>
                              <Loader2 size={16} className="icon-spin" />
                              Proses...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={16} />
                              Check-In Sekarang
                            </>
                          )}
                        </button>
                      ) : (
                        <button className="btn-checked" disabled>
                          <CheckCircle size={16} />
                          Sudah Check-In
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attendance History */}
        {attendanceHistory.length > 0 && (
          <div className="section">
            <h2 className="section-title">Riwayat Kehadiran ({attendanceHistory.length})</h2>

            <div className="history-table">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Judul Seminar</th>
                    <th>Mahasiswa</th>
                    <th>Peran</th>
                    <th>Tanggal Seminar</th>
                    <th>Waktu Check-In</th>
                    <th>Ruangan</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{index + 1}</td>
                      <td>{item.seminar_title}</td>
                      <td>
                        <div>
                          <div>{item.mahasiswa_name}</div>
                          <small>{item.mahasiswa_npm}</small>
                        </div>
                      </td>
                      <td>
                        <span className="role-badge-small">{item.role}</span>
                      </td>
                      <td>{item.tanggal_seminar}</td>
                      <td>{item.confirmed_at}</td>
                      <td>{item.ruangan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckIn;
