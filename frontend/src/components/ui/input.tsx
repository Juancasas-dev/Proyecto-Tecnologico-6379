import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg px-4 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        style={{
          background: '#1a2535',
          border: '1px solid #2e4060',
          color: '#ffffff',
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }