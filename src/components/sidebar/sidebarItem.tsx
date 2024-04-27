'use client'

import * as React from 'react'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

import { motion } from 'framer-motion'

import { buttonVariants } from '@/components/ui/button'
import { useSidebar } from '@/lib/hooks/use-sidebar'
import { cn } from '@/lib/utils'
import { Chat } from './sidebarItems'

interface SidebarItemProps {
  index: number
  chat: Chat
  children: React.ReactNode
}

export function SidebarItem({ index, chat, children }: SidebarItemProps) {
  const params = useSearchParams();
  const { fileId } = useParams()
  const router = useRouter()
  const { chatType } = useSidebar()

  const isActive = params.get('cid') === chat.id
  const newChatId = localStorage.getItem('newChatId') as string
  const shouldAnimate = index === 0 && isActive && newChatId

  if (!chat?.id) return null

  function IconMessage({ className, ...props }: React.ComponentProps<'svg'>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 256 256"
        fill="currentColor"
        className={cn('size-4', className)}
        {...props}
      >
        <path d="M216 48H40a16 16 0 0 0-16 16v160a15.84 15.84 0 0 0 9.25 14.5A16.05 16.05 0 0 0 40 240a15.89 15.89 0 0 0 10.25-3.78.69.69 0 0 0 .13-.11L82.5 208H216a16 16 0 0 0 16-16V64a16 16 0 0 0-16-16ZM40 224Zm176-32H82.5a16 16 0 0 0-10.3 3.75l-.12.11L40 224V64h176Z" />
      </svg>
    )
  }

  return (
    <motion.div
      className="relative h-8"
      variants={{
        initial: {
          height: 0,
          opacity: 0
        },
        animate: {
          height: 'auto',
          opacity: 1
        }
      }}
      initial={shouldAnimate ? 'initial' : undefined}
      animate={shouldAnimate ? 'animate' : undefined}
      transition={{
        duration: 0.25,
        ease: 'easeIn'
      }}
    >
      <div className="absolute left-2 top-1 flex size-6 items-center justify-center">

        <IconMessage className="mr-2" />
      </div>
      <Link
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'group w-full px-8 transition-colors hover:bg-zinc-200/40 dark:hover:bg-zinc-300/10',
          isActive && 'bg-zinc-200 pr-16 font-semibold dark:bg-zinc-800'
        )}
        href={chatType === 'DOCUMENT' ? `./${fileId as string}?cid=${chat.id}` : `?cid=${chat.id}`}
        onClick={() => {
          localStorage.setItem("newChatId", chat.id);

          router.replace(chatType === 'DOCUMENT' ? `./${fileId as string}?=${chat.id}` : `?cid=${chat.id}`);
        }}
      >
        <div
          className="relative max-h-5 flex-1 select-none overflow-hidden text-ellipsis break-all"
          title={chat.chatName}
        >
          <span className="whitespace-nowrap">
            {shouldAnimate ? (
              chat.chatName.split('').map((character: string, index: number) => (
                <motion.span
                  key={index}
                  variants={{
                    initial: {
                      opacity: 0,
                      x: -100
                    },
                    animate: {
                      opacity: 1,
                      x: 0
                    }
                  }}
                  initial={shouldAnimate ? 'initial' : undefined}
                  animate={shouldAnimate ? 'animate' : undefined}
                  transition={{
                    duration: 0.25,
                    ease: 'easeIn',
                    delay: index * 0.05,
                    staggerChildren: 0.05
                  }}
                  onAnimationComplete={() => {
                    if (index === chat.chatName.length - 1) {
                      localStorage.setItem("newChatId", '');

                    }
                  }}
                >
                  {character}
                </motion.span>
              ))
            ) : (
              <span>{chat.chatName}</span>
            )}
          </span>
        </div>
      </Link>
      {isActive && <div className="absolute right-2 top-1">{children}</div>}
    </motion.div>
  )
}
