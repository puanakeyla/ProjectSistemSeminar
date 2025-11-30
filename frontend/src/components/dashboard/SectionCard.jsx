import React from 'react'
import { cn } from '../../lib/utils'
import { Card } from '../ui/card'

export function SectionCard({
  title,
  icon: Icon,
  description,
  action,
  children,
  className,
  headerClassName,
  contentClassName,
}) {
  return (
    <Card className={cn('p-6 md:p-8 space-y-6', className)}>
      <div
        className={cn(
          'flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-100 dark:border-dark-700',
          headerClassName
        )}
      >
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300 flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
      <div className={cn('pt-2', contentClassName)}>{children}</div>
    </Card>
  )
}
