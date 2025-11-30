import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle, Clock, XCircle, GraduationCap, ClipboardList, Calendar, QrCode, Upload, FileCheck, Zap } from 'lucide-react';
// icons changed to emojis
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StatCard } from '../../components/dashboard/StatCard';
import { SectionCard } from '../../components/dashboard/SectionCard';
import { Skeleton } from '../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../components/ui/alert';

const API_URL = 'http://localhost:8000/api';

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending_verification: 0,
    revising: 0,
    attended: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name);
      }

      const response = await axios.get(`${API_URL}/mahasiswa/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data.data;
      setStats({
        total: data.seminar_counts?.total || 0,
        approved: data.seminar_counts?.approved || 0,
        pending_verification: data.seminar_counts?.pending_verification || 0,
        revising: data.seminar_counts?.revising || 0,
        attended: data.attended_seminars_count || 0
      });
      setRecentActivities(data.recent_seminars || []);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const statsDisplay = [
    { label: 'Total Submissions', value: stats.total, icon: FileText, color: '#3B82F6' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle, color: '#10b981' },
    { label: 'Pending Verification', value: stats.pending_verification, icon: Clock, color: '#f59e0b' },
    { label: 'Needs Revision', value: stats.revising, icon: XCircle, color: '#ef4444' },
    { label: 'Attended Seminars', value: stats.attended, icon: GraduationCap, color: '#8b5cf6' }
  ];

  const quickActions = [
    { icon: FileText, label: 'Ajukan Seminar Baru', path: '/mahasiswa/pengajuan', color: '#3B82F6' },
    { icon: ClipboardList, label: 'Cek Status', path: '/mahasiswa/status', color: '#10b981' },
    { icon: QrCode, label: 'Scan QR Absensi', path: '/mahasiswa/scanqr', color: '#8b5cf6' },
    { icon: Upload, label: 'Upload Revisi', path: '/mahasiswa/revisi', color: '#f59e0b' }
  ];

  const getStatusStyle = (status, fallbackColor) => {
    const key = (status || '').toLowerCase();
    const styles = {
      'menunggu verifikasi': { background: '#fff3cd', color: '#856404' },
      'menunggu': { background: '#fff3cd', color: '#856404' },
      'pending': { background: '#fff3cd', color: '#856404' },
      'disetujui': { background: '#d4edda', color: '#155724' },
      'approved': { background: '#d4edda', color: '#155724' },
      'ditolak': { background: '#f8d7da', color: '#721c24' },
      'revisi': { background: '#fff3cd', color: '#856404' }
    };
    return styles[key] || { background: fallbackColor || '#E5E7EB', color: '#111827' };
  };

  return (
    <div className="dashboard-wrapper">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-dark-800 rounded-2xl p-6 md:p-8 shadow-soft border border-gray-200 dark:border-dark-700"
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-glow"
              style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
            >
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Dashboard
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Welcome, <span className="font-semibold text-primary-600 dark:text-primary-400">{userName}</span>
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {statsDisplay.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              delay={index * 0.1}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <SectionCard
            title="Latest Seminars"
            description="Update terbaru pengajuan seminar Anda"
            icon={Calendar}
          >
            {recentActivities.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  No seminar submissions yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                    className="group p-4 bg-gray-50 dark:bg-dark-700 rounded-xl border border-transparent hover:border-primary-200 dark:hover:border-primary-500/40 hover:bg-white dark:hover:bg-dark-600 hover:shadow-soft transition-all duration-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-1">
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                            {activity.judul}
                          </h4>
                          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded-full">
                            {activity.jenis_seminar}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full"
                          style={getStatusStyle(activity.status, activity.status_color)}
                        >
                          {activity.status}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {activity.created_at}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </SectionCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <SectionCard
            title="Quick Actions"
            description="Akses cepat fitur penting"
            icon={Zap}
          >
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const ActionIcon = action.icon && (action.icon.default ? action.icon.default : action.icon)
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: 0.5 + index * 0.05 }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => window.location.href = action.path}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { window.location.href = action.path } }}
                      className="action-card w-full h-auto p-6 flex-col gap-4 hover:scale-105 hover:shadow-glow transition-all duration-200"
                    >
                      <div
                        className="action-icon-bg w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          backgroundColor: `${action.color}22`,
                          color: action.color
                        }}
                      >
                        {ActionIcon && <ActionIcon className="w-6 h-6" />}
                      </div>
                      <span className="text-sm font-semibold text-center">
                        {action.label}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </SectionCard>
        </motion.div>
      </div>
    </div>
  );
}

export default Dashboard;
