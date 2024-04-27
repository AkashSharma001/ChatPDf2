'use client'

import { trpc } from '@/app/_trpc/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { Chat } from './sidebarItems'

interface SidebarActionsProps {
  chat: Chat
}


function IconTrash({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      className={cn('size-4', className)}
      {...props}
    >
      <path d="M216 48h-40v-8a24 24 0 0 0-24-24h-48a24 24 0 0 0-24 24v8H40a8 8 0 0 0 0 16h8v144a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16V64h8a8 8 0 0 0 0-16ZM96 40a8 8 0 0 1 8-8h48a8 8 0 0 1 8 8v8H96Zm96 168H64V64h128Zm-80-104v64a8 8 0 0 1-16 0v-64a8 8 0 0 1 16 0Zm48 0v64a8 8 0 0 1-16 0v-64a8 8 0 0 1 16 0Z" />
    </svg>
  )
}


function IconSpinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      className={cn('size-4 animate-spin', className)}
      {...props}
    >
      <path d="M232 128a104 104 0 0 1-208 0c0-41 23.81-78.36 60.66-95.27a8 8 0 0 1 6.68 14.54C60.15 61.59 40 93.27 40 128a88 88 0 0 0 176 0c0-34.73-20.15-66.41-51.34-80.73a8 8 0 0 1 6.68-14.54C208.19 49.64 232 87 232 128Z" />
    </svg>
  )
}



export function SidebarActions({
  chat,
}: SidebarActionsProps) {
  const router = useRouter()
  const searchParams = useSearchParams();
  const cid: string = searchParams.get('cid') as string;
  const { fileId } = useParams()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isRemovePending, startRemoveTransition] = React.useTransition()



  const [currentlyDeletingChat, setCurrentlyDeletingChat] =
    React.useState<string | null>(null)

  const utils = trpc.useContext()


  const { mutate: deleteChat } =
    trpc.deleteChat.useMutation({
      onSuccess: () => {
        utils.getFileChatMessages.invalidate()
        utils.getFileChats.invalidate()
        if (fileId) {
          router.replace(`./${fileId}`)
          setTimeout(() => {
            router.refresh()
          }, 800)

        } else {
          router.replace(`./research`)
          setTimeout(() => {
            router.refresh()
          }, 400)

        }

        setDeleteDialogOpen(false)

      },
      onMutate({ chatId }) {
        setCurrentlyDeletingChat(chatId)
      },
      onSettled() {
        setCurrentlyDeletingChat(null)
      },
      onError(error, variables, context) {
        console.error(error)
        setDeleteDialogOpen(false)

      },
    })

  return (
    <>
      <div className="space-x-1">

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="size-6 p-0 hover:bg-background"
              disabled={isRemovePending}
              onClick={() => setDeleteDialogOpen(true)}
            >
              <IconTrash />
              <span className="sr-only">Delete</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete chat</TooltipContent>
        </Tooltip>
      </div>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your chat message and remove your
              data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovePending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemovePending}
              onClick={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                event.preventDefault()
                // @ts-ignore
                startRemoveTransition(async () => {
                  const result = deleteChat({ chatId: cid, fileId: fileId ? fileId as string : "" })


                })
              }}
            >
              {currentlyDeletingChat && <IconSpinner className="mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
