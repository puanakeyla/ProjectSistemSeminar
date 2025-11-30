import { useState, useEffect } from 'react';
import axios from 'axios';
import './Status.css';
import { CheckCircle, XCircle, Clock, Calendar, User, Gavel } from 'lucide-react'

const API_URL = 'http://127.0.0.1:8000/api';
const CANCELLABLE_STATUSES = ['draft', 'pending_verification', 'revising', 'approved', 'scheduled'];

function Status() {
  const [statusList, setStatusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    fetchSeminars();
  }, []);

  const fetchSeminars = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/mahasiswa/seminars`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      setStatusList(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching seminars:', err);
      setError('Gagal memuat data seminar');
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved':
      case 'scheduled':
      case 'finished':
        return 'approved';
      case 'cancelled':
        return 'cancelled';
      case 'revising':
        return 'revision';
      case 'draft':
      case 'pending_verification':
      default:
        return 'pending';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'draft': 'Draft',
      'pending_verification': 'Menunggu Verifikasi',
      'approved': 'Disetujui',
      'revising': 'Perlu Revisi',
      'scheduled': 'Terjadwal',
      'finished': 'Selesai',
      'cancelled': 'Dibatalkan'
    };
    return statusMap[status] || status;
  };

  const getApprovalStatus = (approvals) => {
    if (!approvals || approvals.length === 0) return 'Belum ada approval';

    const approved = approvals.filter(a => a.status === 'approved').length;
    const rejected = approvals.filter(a => a.status === 'rejected').length;
    const pending = approvals.filter(a => a.status === 'pending').length;

    return `${approved} Approved, ${rejected} Rejected, ${pending} Pending`;
  };

  const canCancel = (status, isCancelled) => {
    if (isCancelled) return false;
    return CANCELLABLE_STATUSES.includes(status);
  };

  const handleCancel = async (seminarId) => {
    const confirmCancel = window.confirm('Batalkan pengajuan ini? Dosen & admin akan diberi tahu.');
    if (!confirmCancel) {
      return;
    }

    const reason = window.prompt('Alasan pembatalan (opsional):', '') || undefined;

    try {
      setCancellingId(seminarId);
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/mahasiswa/seminars/${seminarId}/cancel`, {
        reason: reason?.trim() || undefined,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      await fetchSeminars();
    } catch (err) {
      console.error('Gagal membatalkan pengajuan:', err);
      const message = err.response?.data?.message || 'Gagal membatalkan pengajuan';
      alert(message);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="status-wrapper">
        <div className="status-header">
          <h1>Status Pengajuan</h1>
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-wrapper">
        <div className="status-header">
          <h1>Status Pengajuan</h1>
          <p style={{ color: '#e74c3c' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="status-wrapper">
      <div className="status-header">
        <h1>Status Pengajuan</h1>
        <p>Pantau status pengajuan seminar Anda</p>
      </div>

      <div className="status-content">
        {statusList.length === 0 ? (
          <div className="empty-state">
            <p>Belum ada pengajuan seminar</p>
            <small>Silakan ajukan seminar dari menu Pengajuan Seminar</small>
          </div>
        ) : (
          statusList.map((item) => (
            <div key={item.id} className={`status-card ${getStatusClass(item.status)}`}>
              <div className="status-card-header">
                <div>
                  <span className="jenis-badge">{item.tipe_display}</span>
                  <h3>{item.judul}</h3>
                </div>
                <span className={`status-badge ${getStatusClass(item.status)}`}>
                  {item.status_display || getStatusText(item.status)}
                </span>
              </div>
              <div className="status-card-body">
                <div className="info-row">
                  <span className="info-label">Tanggal Pengajuan:</span>
                  <span className="info-value">
                    {new Date(item.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                {/* Approval Status dari 3 Dosen */}
                {item.approvals && item.approvals.length > 0 && (
                  <div className="approval-section">
                    <span className="info-label">Status Persetujuan:</span>
                    <div className="approval-list">
                      {item.approvals.map((approval, idx) => (
                        <div key={idx} className="approval-item">
                          <span className="approval-role">
                            {approval.peran === 'pembimbing1' ? (<><User className="w-4 h-4 inline mr-1"/> Pembimbing 1</>) :
                             approval.peran === 'pembimbing2' ? (<><User className="w-4 h-4 inline mr-1"/> Pembimbing 2</>) :
                             (<><Gavel className="w-4 h-4 inline mr-1"/> Penguji</>)}
                          </span>
                          <span className="approval-name">{approval.dosen?.name}</span>
                          <span className={`approval-status ${approval.status}`}>
                            {approval.status === 'approved' ? (<><CheckCircle className="w-4 h-4 inline mr-1"/> Disetujui</>) :
                             approval.status === 'rejected' ? (<><XCircle className="w-4 h-4 inline mr-1"/> Ditolak</>) :
                             approval.status === 'cancelled' ? (<><XCircle className="w-4 h-4 inline mr-1"/> Dibatalkan</>) :
                             (<><Clock className="w-4 h-4 inline mr-1"/> Menunggu</>)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Status */}
                {item.admin_status && (
                  <div className="info-row">
                    <span className="info-label">Status Admin:</span>
                    <span className={`info-value admin-status ${item.admin_status}`}>
                      {item.admin_status === 'approved' ? (<><CheckCircle className="w-4 h-4 inline mr-1"/> Disetujui</>) :
                       item.admin_status === 'rejected' ? (<><XCircle className="w-4 h-4 inline mr-1"/> Ditolak</>) :
                       item.admin_status === 'cancelled' ? (<><XCircle className="w-4 h-4 inline mr-1"/> Dibatalkan Mahasiswa</>) :
                       (<><Clock className="w-4 h-4 inline mr-1"/> Menunggu</>)}
                    </span>
                  </div>
                )}

                {/* Catatan Admin jika ada */}
                {item.admin_catatan && (
                  <div className="info-row">
                    <span className="info-label">Catatan Admin:</span>
                    <span className="info-value">{item.admin_catatan}</span>
                  </div>
                )}

                {item.is_cancelled && (
                  <div className="info-row cancelled-info">
                    <span className="info-label">Pembatalan:</span>
                    <span className="info-value">
                      Dibuat pada {item.cancelled_at
                        ? new Date(item.cancelled_at).toLocaleString('id-ID', {
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })
                        : 'waktu tidak tersedia'}
                      {item.cancel_reason ? ` · ${item.cancel_reason}` : ''}
                    </span>
                  </div>
                )}

                {/* Jadwal jika sudah dijadwalkan */}
                {item.schedule && (
                  <div className="schedule-info">
                    <span className="info-label"><Calendar className="w-4 h-4 inline mr-1"/> Jadwal Seminar:</span>
                    <div className="schedule-details">
                      <p>
                        <strong>Waktu:</strong> {new Date(item.schedule.waktu_mulai).toLocaleString('id-ID')}
                      </p>
                      <p><strong>Ruang:</strong> {item.schedule.ruang}</p>
                      <p><strong>Durasi:</strong> {item.schedule.durasi_menit} menit</p>
                    </div>
                  </div>
                )}

                {canCancel(item.status, item.is_cancelled) && (
                  <div className="action-row">
                    <button
                      className="btn-cancel"
                      onClick={() => handleCancel(item.id)}
                      disabled={cancellingId === item.id}
                    >
                      {cancellingId === item.id ? 'Membatalkan...' : 'Batalkan Pengajuan'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Status;
