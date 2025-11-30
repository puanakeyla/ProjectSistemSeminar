import React from 'react'
import { motion } from 'framer-motion'
import * as CountUpLib from 'react-countup'
import { cn } from '../../lib/utils'

export function StatCard({
  title,
  value,
  icon: Icon,
  color = '#3b82f6',
  trend,
  trendValue,
  className,
  delay = 0,
  loading = false
}) {
  if (loading) {
    return <StatCardSkeleton />
  }

  // Use Icon directly as passed from props
  const IconCandidate = Icon;

  // Normalize CountUp import to support named, default, or namespace shapes
  // Try the named export first, then default, then the module itself.
  const IconComponent = typeof IconCandidate === 'function' ? IconCandidate : null

  // Ensure we only render a valid React component for CountUp
  const CountUpCandidate = [
    CountUpLib?.CountUp,
    CountUpLib?.default,
    typeof CountUpLib === 'function' ? CountUpLib : null,
  ].find((candidate) => typeof candidate === 'function')

  const CountUpComponent = CountUpCandidate || null
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-white p-6 shadow-soft transition-all duration-200",
        "hover:shadow-depth hover:scale-[1.02]",
        "dark:bg-dark-800 dark:border dark:border-dark-700",
        className
      )}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r"
        style={{
          backgroundImage: `linear-gradient(90deg, ${color}, ${color}dd)`,
        }}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {CountUpComponent ? (
                <CountUpComponent
                  end={value}
                  duration={1.5}
                  separator=","
                  decimals={value % 1 !== 0 ? 1 : 0}
                />
              ) : (
                // Fallback: render raw value if CountUp isn't a valid component
                <span>{value}</span>
              )}
            </h3>
            {trend && (
              <span
                className={cn(
                  "text-sm font-semibold",
                  trend === 'up' ? 'text-success' : 'text-danger'
                )}
              >
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </span>
            )}
          </div>
        </div>

        {IconComponent && (
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl"
            style={{
              backgroundColor: `${color}15`,
              color: color
            }}
          >
            <IconComponent className="w-6 h-6" />
          </div>
        )}
      </div>

      <div
        className="absolute bottom-0 right-0 w-32 h-32 opacity-5 pointer-events-none"
        style={{ color }}
      >
        {IconComponent && <IconComponent className="w-full h-full" />}
        {!IconComponent && typeof IconCandidate === 'string' && (
          <div className="w-full h-full flex items-center justify-center text-6xl">{IconCandidate}</div>
        )}
      </div>
    </motion.div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-soft dark:bg-dark-800 dark:border dark:border-dark-700">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-dark-700" />

      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-dark-700 rounded w-1/3 animate-pulse" />
          <div className="h-8 bg-gray-200 dark:bg-dark-700 rounded w-2/3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-dark-700 rounded-xl animate-pulse" />
      </div>
    </div>
  )
}
