import { cn } from "@/lib/utils";


export function SidebarFooter({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-center justify-between py-4 px-2', className)}
      {...props}
    >
      {children}
    </div>
  )
}