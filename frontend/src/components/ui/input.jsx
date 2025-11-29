import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, error, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-xl border-2 bg-white px-4 py-3 text-sm font-medium transition-all duration-200",
        "placeholder:text-gray-400 placeholder:font-normal",
        "focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        "dark:bg-dark-800 dark:border-dark-600 dark:text-white dark:focus:border-primary-500",
        error 
          ? "border-danger focus:border-danger focus:ring-danger/20" 
          : "border-gray-200",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
