import { cn } from "../../lib/utils"

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string
}

const Label = ({ className, ...props }: LabelProps) => (
  <label
    className={cn("text-sm font-medium text-foreground", className)}
    {...props}
  />
)

Label.displayName = "Label"

export { Label }