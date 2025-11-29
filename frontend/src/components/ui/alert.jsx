import * as React from "react"
import { cva } from "class-variance-authority"
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import { cn } from "../../lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border-2 p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:pl-8",
  {
    variants: {
      variant: {
        default: "bg-white border-gray-200 text-gray-900 dark:bg-dark-800 dark:border-dark-600",
        destructive: "bg-danger/10 border-danger/30 text-danger [&>svg]:text-danger",
        success: "bg-success/10 border-success/30 text-success-dark [&>svg]:text-success",
        warning: "bg-warning/10 border-warning/30 text-warning-dark [&>svg]:text-warning",
        info: "bg-primary-50 border-primary-200 text-primary-700 [&>svg]:text-primary-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef(({ className, variant, children, icon: Icon, ...props }, ref) => {
  const defaultIcons = {
    destructive: XCircle,
    success: CheckCircle,
    warning: AlertCircle,
    info: Info,
  }

  const IconComponent = Icon || defaultIcons[variant]

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {IconComponent && (typeof IconComponent === 'string' ? (
        <span className="h-5 w-5 inline-flex items-center justify-center text-lg">{IconComponent}</span>
      ) : (
        <IconComponent className="h-5 w-5" />
      ))}
      <div>{children}</div>
    </div>
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-medium [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
