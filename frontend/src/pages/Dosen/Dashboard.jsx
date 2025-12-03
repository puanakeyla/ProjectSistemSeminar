import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, Users, BarChart2, Calendar, ClipboardList, GraduationCap, XCircle, AlertTriangle, UserRound, CalendarDays } from 'lucide-react'

import { dosenAPI } from '../../services/api'
import { StatCard } from '../../components/dashboard/StatCard'
import { SectionCard } from '../../components/dashboard/SectionCard'
import { Skeleton } from '../../components/ui/skeleton'

function Dashboard({ setCurrentPage }) {
  const [dashboardData, setDashboardData] = useState(null)
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [cancelledSeminars, setCancelledSeminars] = useState([])
  const [showAllCancelled, setShowAllCancelled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await dosenAPI.getDashboard()
      const data = response?.data || {}
      
      setDashboardData(data)
      setPendingApprovals(data.pending_approvals || [])
      setCancelledSeminars(data.cancelled_seminars || [])
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setDashboardData({})
      setPendingApprovals([])
      setCancelledSeminars([])
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

  const approvalCounts = dashboardData?.approval_counts || {}
  const stats = [
    { label: 'Menunggu Persetujuan', value: Number(approvalCounts.menunggu || 0), icon: Clock, color: '#f59e0b' },
    { label: 'Seminar Disetujui', value: Number(approvalCounts.setuju || 0), icon: CheckCircle, color: '#10b981' },
    { label: 'Total Persetujuan', value: Number(approvalCounts.total || 0), icon: Users, color: '#3b82f6' },
    { label: 'Seminar Ditolak', value: Number(approvalCounts.ditolak || 0), icon: XCircle, color: '#ef4444' }
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
              style={{ background: 'linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(37, 99, 235) 100%)' }}
            >
              <GraduationCap className="w-8 h-8" stroke="rgb(37, 99, 235)" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Dashboard Dosen
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Selamat datang di Portal Dosen Pembimbing
              </p>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
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
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-1">
                  Seminar Dibatalkan
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  {cancelledSeminars.length} seminar baru-baru ini dibatalkan oleh mahasiswa
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
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {seminar.user_role}
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SectionCard
            title="Menunggu Persetujuan"
            description="Tinjau dan selesaikan persetujuan terbaru"
            icon={ClipboardList}
            action={
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                {pendingApprovals.length} pending
              </span>
            }
          >
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Tidak ada persetujuan yang menunggu
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((approval, index) => (
                  <motion.div
                    key={approval.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl border border-transparent hover:border-primary-200 dark:hover:border-primary-500/40 hover:bg-white dark:hover:bg-dark-600 transition-all duration-200"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {approval.mahasiswa_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {approval.mahasiswa_npm || '-'}
                          </p>
                        </div>
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300 uppercase tracking-wide">
                          {approval.jenis_seminar || approval.tipe || '-'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {approval.judul}
                      </p>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-200">
                            <UserRound className="w-3.5 h-3.5" />
                            {approval.peran}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {formatDate(approval.created_at)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition"
                          onClick={() => {
                            localStorage.setItem('selected_approval_id', approval.id)
                            localStorage.setItem('selected_seminar_id', approval.seminar_id)
                            setCurrentPage('approval')
                          }}
                        >
                          Tinjau
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Jadwal Hari Ini"
            description="Seminar yang dijadwalkan hari ini"
            icon={Calendar}
            action={
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-white border border-gray-200 shadow-sm hover:border-primary-300 dark:bg-dark-800 dark:border-dark-600"
                onClick={() => (window.location.href = '/dosen/jadwal')}
              >
                Lihat Jadwal
              </button>
            }
          >
            {dashboardData?.today_seminars?.length === 0 || !dashboardData?.today_seminars ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Tidak ada jadwal hari ini
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData.today_seminars.map((schedule, index) => (
                  <motion.div
                    key={schedule.id || index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 * index }}
                    className="p-4 rounded-xl border border-gray-100 dark:border-dark-700 bg-white/70 dark:bg-dark-700"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {schedule.mahasiswa_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {schedule.user_role}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300 uppercase tracking-wide">
                          {schedule.jenis_seminar}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                          {schedule.ruangan}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary-500" />
                        {schedule.waktu_display}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
