import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart2,
  Clock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  AlertTriangle,
  RefreshCcw,
  ShieldCheck,
  XCircle
} from 'lucide-react'

import { adminAPI } from '../../services/api'
import { StatCard } from '../../components/dashboard/StatCard'
import { SectionCard } from '../../components/dashboard/SectionCard'
import { Skeleton } from '../../components/ui/skeleton'
import { Alert, AlertDescription } from '../../components/ui/alert'

function Dashboard() {
  const [stats, setStats] = useState({
    totalSeminars: 0,
    pendingVerification: 0,
    scheduledToday: 0,
    totalAttendance: 0,
    verificationRate: 0,
    scheduleRate: 0
  })
  const [recentSeminars, setRecentSeminars] = useState([])
  const [todaySeminars, setTodaySeminars] = useState([])
  const [cancelledSeminars, setCancelledSeminars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminAPI.getDashboard()
      const data = response.data || response

      setStats({
        totalSeminars: data?.seminar_statistics?.total || 0,
        pendingVerification: data?.seminar_statistics?.pending_verification || 0,
        scheduledToday: data?.today_seminars?.length || 0,
        totalAttendance: data?.attendance_statistics?.total_attendances || 0,
        verificationRate: data?.seminar_statistics?.verification_rate || 0,
        scheduleRate: data?.schedule_statistics?.success_rate || 0
      })
      setRecentSeminars(Array.isArray(data?.recent_seminars) ? data.recent_seminars : [])
      setTodaySeminars(Array.isArray(data?.today_seminars) ? data.today_seminars : [])
      setCancelledSeminars(Array.isArray(data?.cancelled_seminars) ? data.cancelled_seminars : [])
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err.response?.data?.message || 'Gagal memuat data dashboard')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statsDisplay = [
    { label: 'Total Seminars', value: stats.totalSeminars, icon: BarChart2, color: '#3b82f6' },
    { label: 'Pending Verification', value: stats.pendingVerification, icon: Clock, color: '#f59e0b' },
    { label: 'Today Schedules', value: stats.scheduledToday, icon: CalendarDays, color: '#8b5cf6' },
    { label: 'Total Attendance', value: stats.totalAttendance, icon: CheckCircle2, color: '#10b981' }
  ]

  const progressMetrics = [
    {
      label: 'Tingkat Verifikasi',
      value: Number(stats.verificationRate || 0),
      gradient: 'from-emerald-400 to-emerald-600',
      caption: 'Jumlah seminar yang berhasil diverifikasi'
    },
    {
      label: 'Tingkat Penjadwalan',
      value: Number(stats.scheduleRate || 0),
      gradient: 'from-sky-400 to-blue-600',
      caption: 'Konversi seminar terjadwal ke kalender resmi'
    }
  ]

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  const latestSeminars = Array.isArray(recentSeminars) ? recentSeminars : []

  return (
    <div className="dashboard-wrapper">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-dark-800 rounded-2xl p-6 md:p-8 shadow-soft border border-gray-200 dark:border-dark-700"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-glow">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  Dashboard Admin
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-400">
                  Sistem Manajemen Seminar Universitas Lampung
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary-300 hover:text-primary-600 dark:border-dark-600 dark:text-gray-200"
            >
              <RefreshCcw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </motion.div>

        {error && (
          <Alert variant="warning" className="shadow-none">
            <AlertDescription className="font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsDisplay.map((stat, index) => (
            <StatCard
              key={stat.label}
              title={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              delay={index * 0.1}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <SectionCard
            title="Kesehatan Operasional"
            description="Pantau konversi verifikasi dan penjadwalan"
            icon={BarChart2}
            className="xl:col-span-1"
          >
            <div className="space-y-6">
              {progressMetrics.map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-200">
                    <span>{metric.label}</span>
                    <span>{Math.round(metric.value)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-dark-700">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${metric.gradient}`}
                      style={{ width: `${Math.min(metric.value, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{metric.caption}</p>
                </div>
              ))}
            </div>

            {todaySeminars.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Jadwal Hari Ini
                </h3>
                <div className="space-y-3">
                  {todaySeminars.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-sm dark:border-dark-700 dark:bg-dark-700"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {schedule.mahasiswa?.name || 'Mahasiswa'}
                        </span>
                        <span className="text-xs font-semibold text-primary-600 dark:text-primary-300">
                          {schedule.tipe?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {formatTime(schedule.waktu_mulai)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" /> {formatDate(schedule.waktu_mulai)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          📍 {schedule.ruang || 'TBD'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Seminar Menunggu Verifikasi"
            description="Pastikan proposal siap dijadwalkan"
            icon={ClipboardList}
            className="xl:col-span-2"
            action={
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                {latestSeminars.length} kasus
              </span>
            }
          >
            {latestSeminars.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Tidak ada seminar menunggu verifikasi
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-dark-700">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-dark-800 dark:text-gray-400">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Mahasiswa</th>
                      <th className="px-4 py-3 text-left font-semibold">Judul</th>
                      <th className="px-4 py-3 text-left font-semibold">Tipe</th>
                      <th className="px-4 py-3 text-left font-semibold">Approval</th>
                      <th className="px-4 py-3 text-right font-semibold">Diajukan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
                    {latestSeminars.map((seminar) => (
                      <tr key={seminar.id} className="bg-white/60 dark:bg-dark-800">
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {seminar.mahasiswa_name || 'Mahasiswa'}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {seminar.mahasiswa_npm || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 max-w-xs">
                          <p className="text-gray-700 dark:text-gray-200 line-clamp-2">
                            {seminar.judul}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 dark:bg-primary-950 dark:text-primary-300">
                            {seminar.tipe === 'proposal' ? '📋 Proposal' : '📘 Hasil'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${seminar.approval_count === 3 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {seminar.approval_count || 0}/3 Disetujui
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-gray-500 dark:text-gray-400">
                          {formatDate(seminar.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
