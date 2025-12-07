import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Calendar, XCircle, FileEdit } from 'lucide-react';
import { notificationAPI } from '../../services/api';
import './NotificationBell.css';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Poll every 60 seconds instead of 30
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      // Silently fail for unread count to prevent console spam
      if (error.response?.status === 401) {
        // Token expired, stop polling
        return;
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications(1);
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'schedule_conflict':
        return <XCircle size={20} className="notif-icon-conflict" />;
      case 'seminar_rejected':
        return <XCircle size={20} className="notif-icon-rejected" />;
      case 'seminar_cancelled_by_mahasiswa':
        return <XCircle size={20} className="notif-icon-cancelled" />;
      case 'seminar_cancelled_by_admin':
        return <XCircle size={20} className="notif-icon-cancelled" />;
      case 'seminar_approved':
        return <Check size={20} className="notif-icon-success" />;
      case 'admin_verification_approved':
        return <Check size={20} className="notif-icon-success" />;
      case 'admin_verification_rejected':
        return <XCircle size={20} className="notif-icon-rejected" />;
      case 'seminar_scheduled':
        return <Calendar size={20} className="notif-icon-info" />;
      case 'seminar_rescheduled':
        return <Calendar size={20} className="notif-icon-warning" />;
      case 'new_seminar_submission':
        return <Bell size={20} className="notif-icon-new" />;
      case 'revision_added':
        return <FileEdit size={20} className="notif-icon-warning" />;
      default:
        return <Bell size={20} className="notif-icon-default" />;
    }
  };

  const renderNotificationDetails = (notif) => {
    const data = notif.data || {};
    
    return (
      <div className="notif-details">
        {/* Rejected By Info */}
        {data.rejected_by && (
          <div className="notif-meta">
            <span className="meta-label">Ditolak oleh:</span>
            <span className="meta-value">{data.rejected_by}</span>
          </div>
        )}
        
        {/* Verified By Info */}
        {data.verified_by && (
          <div className="notif-meta">
            <span className="meta-label">Diverifikasi oleh:</span>
            <span className="meta-value">{data.verified_by}</span>
          </div>
        )}
        
        {/* Rejection Reason */}
        {data.rejection_reason && (
          <div className="notif-meta">
            <span className="meta-label">Alasan:</span>
            <span className="meta-value">{data.rejection_reason}</span>
          </div>
        )}
        
        {/* Cancelled By Info */}
        {data.cancelled_by && (
          <div className="notif-meta">
            <span className="meta-label">Dibatalkan oleh:</span>
            <span className="meta-value">{data.cancelled_by} ({data.cancelled_by_role || 'Admin'})</span>
          </div>
        )}
        
        {/* Approved By Info */}
        {data.approved_by && (
          <div className="notif-meta">
            <span className="meta-label">Disetujui oleh:</span>
            <span className="meta-value">{data.approved_by} ({data.approved_role || ''})</span>
          </div>
        )}
        
        {/* Reason */}
        {(data.rejection_reason || data.cancel_reason) && (
          <div className="notif-meta reason">
            <span className="meta-label">Alasan:</span>
            <span className="meta-value">{data.rejection_reason || data.cancel_reason}</span>
          </div>
        )}
        
        {/* Schedule Info */}
        {data.waktu_mulai && data.ruang && (
          <div className="notif-meta">
            <span className="meta-label">Jadwal:</span>
            <span className="meta-value">{new Date(data.waktu_mulai).toLocaleString('id-ID')} - {data.ruang}</span>
          </div>
        )}
        
        {/* Reschedule Info */}
        {data.old_time && data.new_time && (
          <div className="notif-meta">
            <span className="meta-label">Diubah oleh:</span>
            <span className="meta-value">{data.updated_by}</span>
          </div>
        )}
        
        {/* Mahasiswa Info (for dosen/admin) */}
        {data.mahasiswa_name && (
          <div className="notif-meta">
            <span className="meta-label">Mahasiswa:</span>
            <span className="meta-value">{data.mahasiswa_name} ({data.mahasiswa_npm})</span>
          </div>
        )}
        
        {/* Revision Info */}
        {data.kategori && (
          <div className="notif-meta">
            <span className="meta-label">Kategori:</span>
            <span className="meta-value">{data.kategori}</span>
          </div>
        )}
        
        {data.poin_revisi && (
          <div className="notif-meta reason">
            <span className="meta-label">Detail Revisi:</span>
            <span className="meta-value">{data.poin_revisi}</span>
          </div>
        )}
        
        {data.dosen_name && !data.mahasiswa_name && (
          <div className="notif-meta">
            <span className="meta-label">Dari Dosen:</span>
            <span className="meta-value">{data.dosen_name}</span>
          </div>
        )}
      </div>
    );
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button className="notification-bell-button" onClick={handleToggle}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifikasi</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Memuat notifikasi...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={40} className="empty-icon" />
                <p>Tidak ada notifikasi</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                >
                  <div className="notif-icon-wrapper">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notif-content">
                    <h4>{notif.title}</h4>
                    <p>{notif.message}</p>
                    {renderNotificationDetails(notif)}
                    <span className="notif-time">{formatTime(notif.created_at)}</span>
                  </div>
                  <div className="notif-actions">
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="notif-action-btn"
                        title="Tandai dibaca"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="notif-action-btn delete"
                      title="Hapus"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { NotificationBell };
export default NotificationBell;
