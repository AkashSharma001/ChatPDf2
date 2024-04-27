
import * as React from 'react'

import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SidebarList } from '../sidebar/sidebar-list'
import NewChat from './NewChat'
import ChatModeDropdown from './chatModeDropdown'




export async function ChatHistory() {



  return (
    <div className="flex flex-col h-full">
      {/* <div className='ml-2'>
        <ChatModeDropdown />
      </div> */}
      <NewChat />
      <p className='text-gray-500 ml-2 font-bold text-xs'>CHAT HISTORY</p>
      <React.Suspense
        fallback={
          <div className="flex flex-col flex-1 px-4 space-y-4 overflow-auto">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-full h-6 rounded-md shrink-0 animate-pulse bg-zinc-200 dark:bg-zinc-800"
              />
            ))}
          </div>
        }
      >
        {/* @ts-ignore */}
        <SidebarList />
      </React.Suspense>
    </div>
  )
}
