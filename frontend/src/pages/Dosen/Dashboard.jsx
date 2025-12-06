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
  const [scheduledSeminars, setScheduledSeminars] = useState([])
  const [loading, setLoading] = useState(true)
  const [dosenName, setDosenName] = useState('')

  useEffect(() => {
    fetchDashboardData()

    // Get dosen name from localStorage
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      setDosenName(user.name)
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await dosenAPI.getDashboard({ signal: controller.signal })
      clearTimeout(timeoutId)

      const data = response?.data || {}

      setDashboardData(data)
      setPendingApprovals(data.pending_approvals || [])
      setScheduledSeminars(data.scheduled_seminars || [])
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('Request timeout')
      } else {
        console.error('Failed to fetch dashboard data:', err)
      }
      setDashboardData({})
      setPendingApprovals([])
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
                Dasbor Dosen
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Selamat datang, <span className="font-semibold text-primary-600 dark:text-primary-400">{dosenName}</span>
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
