import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, Users, BarChart2, Calendar, ClipboardList, GraduationCap } from 'lucide-react'

import { dosenAPI } from '../../services/api'
import { StatCard } from '../../components/dashboard/StatCard'
import { SectionCard } from '../../components/dashboard/SectionCard'
import { Skeleton } from '../../components/ui/skeleton'

function Dashboard() {
  const [statistics, setStatistics] = useState(null)
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, approvalsRes] = await Promise.all([
        dosenAPI.getStatistics(),
        dosenAPI.getPendingApprovals()
      ])

      setStatistics(statsRes?.data || statsRes)
      const approvalsData = Array.isArray(approvalsRes?.data)
        ? approvalsRes.data
        : Array.isArray(approvalsRes)
          ? approvalsRes
          : []
      setPendingApprovals(approvalsData.slice(0, 4))
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
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

  const stats = [
    { label: 'Menunggu Persetujuan', value: Number(statistics?.pending || 0), icon: Clock, color: '#f59e0b' },
    { label: 'Seminar Disetujui', value: Number(statistics?.approved || 0), icon: CheckCircle, color: '#10b981' },
    { label: 'Total Persetujuan', value: Number(statistics?.total_approvals || 0), icon: Users, color: '#3b82f6' },
    { label: 'Tingkat Persetujuan (%)', value: Number(statistics?.approval_rate || 0), icon: BarChart2, color: '#8b5cf6' }
  ]

  const upcomingSchedules = [
    {
      mahasiswa: 'Dewi Kusuma',
      tipe: 'Proposal',
      waktu: '21 Jan 2025, 09:00',
      ruang: 'Lab A301',
      peran: 'Pembimbing 1'
    },
    {
      mahasiswa: 'Rizky Pratama',
      tipe: 'Hasil',
      waktu: '22 Jan 2025, 13:00',
      ruang: 'Ruang Sidang',
      peran: 'Penguji'
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
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-glow">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Dashboard Dosen
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Selamat datang di Portal Dosen Pembimbing
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-5 h-5 text-primary-500" />
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
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
                            {approval.mahasiswa_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {approval.mahasiswa_npm}
                          </p>
                        </div>
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300 uppercase tracking-wide">
                          {approval.tipe}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {approval.judul}
                      </p>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-200">
                            👤 {approval.peran}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            📅 {formatDate(approval.created_at)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition"
                          onClick={() => (window.location.href = '/dosen/approvals')}
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
            title="Jadwal Mendatang"
            description="Siapkan diri untuk peran Anda berikutnya"
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
            <div className="space-y-3">
              {upcomingSchedules.map((schedule, index) => (
                <motion.div
                  key={`${schedule.mahasiswa}-${index}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="p-4 rounded-xl border border-gray-100 dark:border-dark-700 bg-white/70 dark:bg-dark-700"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {schedule.mahasiswa}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {schedule.peran}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300 uppercase tracking-wide">
                        {schedule.tipe}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {schedule.ruang}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-primary-500" />
                      {schedule.waktu}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
