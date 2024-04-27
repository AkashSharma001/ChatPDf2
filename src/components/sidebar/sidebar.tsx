'use client'

import * as React from 'react'

import { useSidebar } from '@/lib/hooks/use-sidebar'
import { cn } from '@/lib/utils'

export interface SidebarProps extends React.ComponentProps<'div'> {}

export function Sidebar({ className, children }: SidebarProps) {
  const { isSidebarOpen, isLoading } = useSidebar()

  return (
    <div
      data-state={isSidebarOpen && !isLoading ? 'open' : 'closed'}
      className={cn(className, `h-full flex-col dark:bg-zinc-950 ${isSidebarOpen ? "flex-[0.1] border-t border-2 border-b-0 border-gray-300 z-30  lg:border-l lg:border-t-0":""}`)}
    >
      {children}
    </div>
  )
}