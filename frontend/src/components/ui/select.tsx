import * as SelectPrimitive from "@radix-ui/react-select"
import { cn } from "../../lib/utils"
import { Icon } from "@iconify/react"

const Select = SelectPrimitive.Root
const SelectValue = SelectPrimitive.Value

const SelectTrigger = ({ className, children, ...props }: SelectPrimitive.SelectTriggerProps) => (
  <SelectPrimitive.Trigger
    className={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon>
      <Icon icon="solar:alt-arrow-down-linear" height={16} />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
)

const SelectContent = ({ className, children, ...props }: SelectPrimitive.SelectContentProps) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md",
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
)

const SelectItem = ({ className, children, ...props }: SelectPrimitive.SelectItemProps) => (
  <SelectPrimitive.Item
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
)

export { Select, SelectValue, SelectTrigger, SelectContent, SelectItem }