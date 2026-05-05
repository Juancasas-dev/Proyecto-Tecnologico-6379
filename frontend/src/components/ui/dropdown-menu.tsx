import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { cn } from "../../lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuContent = ({ className, sideOffset = 4, ...props }: DropdownMenuPrimitive.DropdownMenuContentProps & { sideOffset?: number }) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
)
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = ({ className, ...props }: DropdownMenuPrimitive.DropdownMenuItemProps) => (
  <DropdownMenuPrimitive.Item
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
      className
    )}
    {...props}
  />
)
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = ({ className, ...props }: DropdownMenuPrimitive.DropdownMenuSeparatorProps) => (
  <DropdownMenuPrimitive.Separator
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
)
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}