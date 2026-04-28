import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

const Checkbox = ({ className, ...props }: CheckboxPrimitive.CheckboxProps) => (
  <CheckboxPrimitive.Root
    className={cn(
      "h-4 w-4 rounded border border-primary bg-transparent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-white",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      <Check className="h-3 w-3" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
)

Checkbox.displayName = "Checkbox"

export { Checkbox }