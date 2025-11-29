import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary-500 text-white shadow-soft hover:bg-primary-600 hover:shadow-glow active:scale-95",
        destructive:
          "bg-danger text-white shadow-soft hover:bg-danger-dark active:scale-95",
        outline:
          "border-2 border-primary-500 bg-transparent text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-dark-700 dark:text-white dark:hover:bg-dark-600",
        ghost:
          "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-dark-700 dark:hover:text-white",
        link:
          "text-primary-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 py-2 text-xs",
        lg: "h-12 px-8 py-3 text-base",
        xl: "h-14 px-10 py-3.5 text-lg",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
