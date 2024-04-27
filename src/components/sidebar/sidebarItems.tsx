'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { SidebarItem } from './sidebarItem';
import { SidebarActions } from './sidebar-action';
import { TooltipProvider } from '../ui/tooltip';



export interface Chat extends Record<string, any> {
  userId: string | null;
  fileId: string | null;
  id: string;
  createdAt: string;
  updatedAt: string;
  chatName: string;
}

interface SidebarItemsProps {
  chats?: Chat[]
}

export function SidebarItems({ chats }: SidebarItemsProps) {
  if (!chats?.length) return null

  return (
    <AnimatePresence>
      {chats.map(
        (chat, index) =>
          chat && (
            <motion.div
              key={chat?.id}
              exit={{
                opacity: 0,
                height: 0
              }}
            >
              <SidebarItem index={index} chat={chat}>
                <TooltipProvider>
                  <SidebarActions
                    chat={chat}
                  />
                </TooltipProvider>
              </SidebarItem>
            </motion.div>
          )
      )}
    </AnimatePresence>
  )
}
