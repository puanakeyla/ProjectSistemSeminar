import React, { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle, Clock, XCircle, GraduationCap, ClipboardList, Calendar, QrCode, Upload, FileCheck, Zap, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { StatCard } from '../../components/dashboard/StatCard';
import { SectionCard } from '../../components/dashboard/SectionCard';
import { Skeleton } from '../../components/ui/skeleton';
import { Alert, AlertDescription } from '../../components/ui/alert';

// Lazy load heavy chart components
const BarChart = lazy(() => import('recharts').then(m => ({ default: m.BarChart })));
const Bar = lazy(() => import('recharts').then(m => ({ default: m.Bar })));
const LineChart = lazy(() => import('recharts').then(m => ({ default: m.LineChart })));
const Line = lazy(() => import('recharts').then(m => ({ default: m.Line })));
const PieChart = lazy(() => import('recharts').then(m => ({ default: m.PieChart })));
const Pie = lazy(() => import('recharts').then(m => ({ default: m.Pie })));
const Cell = lazy(() => import('recharts').then(m => ({ default: m.Cell })));
const XAxis = lazy(() => import('recharts').then(m => ({ default: m.XAxis })));
const YAxis = lazy(() => import('recharts').then(m => ({ default: m.YAxis })));
const CartesianGrid = lazy(() => import('recharts').then(m => ({ default: m.CartesianGrid })));
const Tooltip = lazy(() => import('recharts').then(m => ({ default: m.Tooltip })));
const Legend = lazy(() => import('recharts').then(m => ({ default: m.Legend })));
const ResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })));

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
  const [scheduledSeminars, setScheduledSeminars] = useState([]);
  const [cancelledSeminars, setCancelledSeminars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  // Memoize computed values BEFORE any conditional returns
  const statsDisplay = useMemo(() => [
    { label: 'Total Pengajuan', value: stats.total, icon: FileText, color: '#3B82F6' },
    { label: 'Disetujui', value: stats.approved, icon: CheckCircle, color: '#10b981' },
    { label: 'Menunggu Verifikasi', value: stats.pending_verification, icon: Clock, color: '#f59e0b' },
    { label: 'Butuh Revisi', value: stats.revising, icon: XCircle, color: '#ef4444' },
    { label: 'Seminar Dihadiri', value: stats.attended, icon: GraduationCap, color: '#8b5cf6' }
  ], [stats]);

  const quickActions = useMemo(() => [
    { icon: FileText, label: 'Ajukan Seminar Baru', targetPage: 'pengajuan', color: '#3B82F6' },
    { icon: ClipboardList, label: 'Cek Status', targetPage: 'status', color: '#10b981' },
    { icon: QrCode, label: 'Scan QR Absensi', targetPage: 'scanqr', color: '#8b5cf6' },
    { icon: Upload, label: 'Upload Revisi', targetPage: 'revisi', color: '#f59e0b' }
  ], []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (userStr) {
          const user = JSON.parse(userStr);
          if (isMounted) setUserName(user.name);
        }

        const response = await axios.get(`${API_URL}/mahasiswa/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!isMounted) return;

        const data = response.data.data;
        setStats({
          total: data.counts?.total || 0,
          approved: data.counts?.approved || 0,
          pending_verification: data.counts?.pending_verification || 0,
          revising: data.counts?.revising || 0,
          attended: data.attended_seminars_count || 0
        });
        setRecentActivities(data.recent_seminars || []);
        setScheduledSeminars(data.scheduled_seminars || []);
        setCancelledSeminars(data.cancelled_seminars || []);
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching dashboard:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

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

  const handleQuickAction = (page) => {
    if (!page) return;

    // Broadcast lightweight navigation intent so App layout can switch pages without page reloads
    window.dispatchEvent(new CustomEvent('semar:navigate', { detail: { page } }));
  };

  const getStatusStyle = (status, fallbackColor) => {
    const key = (status || '').toLowerCase();
    const styles = {
      'menunggu verifikasi': { background: '#fff3cd', color: '#856404' },
      'menunggu': { background: '#fff3cd', color: '#856404' },
      'pending': { background: '#fff3cd', color: '#856404' },
      'disetujui': { background: '#d4edda', color: '#155724' },
      'approved': { background: '#d4edda', color: '#155724' },
      'ditolak': { background: '#f8d7da', color: '#721c24' },
      'revisi': { background: '#fff3cd', color: '#856404' },
      'dibatalkan': { background: '#fdecea', color: '#c0392b' }
    };
    return styles[key] || { background: fallbackColor || '#E5E7EB', color: '#111827' };
  };

  return (
    <div className="dashboard-wrapper">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-dark-800 rounded-2xl p-6 md:p-8 shadow-soft border border-gray-200 dark:border-dark-700"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-glow"
                style={{ background: 'linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(37, 99, 235) 100%)' }}
              >
                <GraduationCap className="w-8 h-8" stroke="rgb(37, 99, 235)" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  Dasbor Mahasiswa
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  Selamat datang, <span className="font-semibold text-primary-600 dark:text-primary-400">{userName}</span>
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="w-5 h-5 text-primary-500" />
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
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
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <SectionCard
            title="Aksi Cepat"
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
                      onClick={() => handleQuickAction(action.targetPage)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleQuickAction(action.targetPage);
                        }
                      }}
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
