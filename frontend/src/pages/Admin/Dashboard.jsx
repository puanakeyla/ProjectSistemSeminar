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
  const [showAllCancelled, setShowAllCancelled] = useState(false)
  const [pendingVerificationList, setPendingVerificationList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [dashboardResponse, allSeminarsResponse] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getSeminarsForVerification('all')
      ])
      
      const data = dashboardResponse.data || dashboardResponse

      // Calculate verification rate: (approved + scheduled) / total * 100
      const total = data?.seminar_statistics?.total || 0
      const approved = data?.seminar_statistics?.approved || 0
      const scheduled = data?.seminar_statistics?.scheduled || 0
      const verificationRate = total > 0 ? ((approved + scheduled) / total) * 100 : 0
      
      // Calculate schedule rate: scheduled / (approved + scheduled) * 100
      const scheduleRate = (approved + scheduled) > 0 ? (scheduled / (approved + scheduled)) * 100 : 0
      
      setStats({
        totalSeminars: total,
        pendingVerification: data?.seminar_statistics?.pending_verification || 0,
        scheduledToday: data?.today_seminars?.length || 0,
        totalAttendance: data?.attendance_statistics?.total_attendances || 0,
        verificationRate: verificationRate,
        scheduleRate: scheduleRate
      })
      setRecentSeminars(Array.isArray(data?.recent_seminars) ? data.recent_seminars : [])
      setTodaySeminars(Array.isArray(data?.today_seminars) ? data.today_seminars : [])
      setCancelledSeminars(Array.isArray(data?.cancelled_seminars) ? data.cancelled_seminars : [])
      
      // Get all seminars with pending_verification status (show approval progress for all)
      const allSeminars = allSeminarsResponse.data || []
      const pendingSeminars = allSeminars.filter(s => s.status === 'pending_verification')
      setPendingVerificationList(pendingSeminars.slice(0, 5)) // Show only first 5
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

  const latestSeminars = Array.isArray(pendingVerificationList) ? pendingVerificationList : []

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
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-glow"
                style={{ background: 'linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(37, 99, 235) 100%)' }}
              >
                <ShieldCheck className="w-8 h-8" stroke="rgb(37, 99, 235)" strokeWidth={2.5} />
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

        {cancelledSeminars.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-2xl p-6 border-2 border-red-200 dark:border-red-800 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-1">
                  Seminar Dibatalkan
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  {cancelledSeminars.length} seminar dibatalkan oleh dosen pembimbing/penguji
                </p>
                <div className="space-y-3">
                  {(showAllCancelled ? cancelledSeminars : cancelledSeminars.slice(0, 3)).map((seminar, index) => (
                    <motion.div
                      key={seminar.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      className="bg-white dark:bg-dark-800 rounded-xl p-4 border border-red-200 dark:border-red-800"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300">
                              {seminar.jenis_seminar}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {seminar.mahasiswa_name} ({seminar.mahasiswa_npm})
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                            {seminar.judul}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                            {seminar.days_ago === 0 ? 'Hari ini' : `${seminar.days_ago} hari lalu`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {seminar.cancelled_at}
                          </p>
                        </div>
                      </div>
                      {seminar.cancel_reason && (
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Alasan Pembatalan:
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                            "{seminar.cancel_reason}"
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                {cancelledSeminars.length > 3 && (
                  <button
                    onClick={() => setShowAllCancelled(!showAllCancelled)}
                    className="mt-4 w-full px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors duration-200"
                  >
                    {showAllCancelled ? 'Tampilkan Lebih Sedikit' : `Selengkapnya (${cancelledSeminars.length - 3} lainnya)`}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {latestSeminars.map((seminar) => {
                  const approvedCount = seminar.approvals?.filter(a => a.status === 'approved').length || 0
                  const mahasiswaName = seminar.mahasiswa?.name || seminar.mahasiswa_name || 'Mahasiswa'
                  const mahasiswaNpm = seminar.mahasiswa?.npm || seminar.mahasiswa_npm || '-'
                  const seminarType = seminar.jenis_seminar_display || seminar.tipe || 'Seminar'
                  
                  const getTipeColor = (tipe) => {
                    const colors = {
                      'proposal': '#3b82f6',
                      'seminar_proposal': '#3b82f6',
                      'hasil': '#10b981',
                      'seminar_hasil': '#10b981',
                      'komprehensif': '#8b5cf6'
                    }
                    return colors[tipe?.toLowerCase()] || '#6b7280'
                  }
                  
                  return (
                    <div
                      key={seminar.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-400 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                            {mahasiswaName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{mahasiswaName}</h4>
                            <span className="text-xs text-gray-500">{mahasiswaNpm}</span>
                          </div>
                        </div>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: getTipeColor(seminar.jenis_seminar || seminar.tipe) }}
                        >
                          {seminarType}
                        </span>
                      </div>
                      
                      <h3 className="text-sm font-medium text-gray-900 mb-3 line-clamp-2">
                        {seminar.judul}
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-semibold ${
                          approvedCount === 3 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          <CheckCircle2 className="w-3 h-3" />
                          {approvedCount}/3 Disetujui
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {formatDate(seminar.created_at)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
