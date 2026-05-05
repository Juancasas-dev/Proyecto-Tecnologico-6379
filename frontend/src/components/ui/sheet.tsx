import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "../../lib/utils"

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetTitle = DialogPrimitive.Title

interface SheetContentProps extends DialogPrimitive.DialogContentProps {
  side?: 'left' | 'right' | 'top' | 'bottom'
  className?: string
}

const SheetContent = ({ side = 'right', className, children, ...props }: SheetContentProps) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" />
    <DialogPrimitive.Content
      className={cn(
        'fixed z-50 bg-background shadow-lg transition ease-in-out',
        side === 'left' && 'inset-y-0 left-0 h-full',
        side === 'right' && 'inset-y-0 right-0 h-full',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
)

SheetContent.displayName = 'SheetContent'

export { Sheet, SheetTrigger, SheetContent, SheetTitle }