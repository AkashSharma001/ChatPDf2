'use client'

import { trpc } from "@/app/_trpc/client";
import { format } from "date-fns";
import { Ghost, Loader2, MessageSquare, Plus, Trash } from "lucide-react";
import Image from "next/image";
import { useContext, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import UploadButton from "../UploadButton";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { ChatContext } from "./ChatContext";


const UploadDocsModal = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { chatId } = useContext(ChatContext)
  const [currentlyDeletingFile, setCurrentlyDeletingFile] = useState<
    string | null
  >(null);

  const utils = trpc.useUtils();


  const { data: files, isLoading, refetch } = trpc.getChatIdFile.useQuery({ chatId },);

  const { mutate: deleteChatFile } = trpc.deleteChatFile.useMutation({
    onSuccess: () => {
      utils.getChatIdFile.invalidate();
    },
    onMutate({ fileId }) {
      setCurrentlyDeletingFile(fileId);
    },
    onSettled() {
      setCurrentlyDeletingFile(null);
    },
  });

  // Function to trigger a refetch
  const handleRefetch = () => {
    refetch(); // Call the 'refetch' function to trigger a refetch
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!!isOpen) {
        handleRefetch(); // Trigger refetch only when isOpen is true
      }
    }, 1000); // Refetch interval: 1000ms (1 second)

    // Clean up the interval on component unmount or when isOpen changes to false
    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          setIsOpen(v)
        }
      }}>
      <DialogTrigger
        onClick={() => setIsOpen(true)}
        asChild>
        <Button>Upload File</Button>
      </DialogTrigger>

      <DialogContent className="max-w-[60vw] h-[80vh]">
        {/* <UploadDropzone isSubscribed={isSubscribed} /> */}
        <main className="m-4 ">
          <div className=" flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0">
            <div className="flex gap-2">
              <Image
                alt="DOCUMENTImg"
                src="/documentFULLSQUARE.svg"
                width={2.5}
                height={2.5}
                className="w-10 h-10  font-bold"
              /> <h3 className="mb-3 font-bold text-3xl text-gray-900">
                Upload Reference Files
              </h3>
            </div>

            <UploadButton isSubscribed={false} customUpload={true} />
            {/* <Button>upload</Button> */}
          </div>

          {/* display all user files */}
          {files && files?.length !== 0 ? (
            <ul className="mt-8 grid grid-cols-1 gap-6 divide-y divide-zinc-200 md:grid-cols-2 lg:grid-cols-3">
              {files
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((file) => (
                  <li
                    key={file.id}
                    className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow transition hover:shadow-lg"
                  >
                    <div
                      className="flex flex-col gap-2"
                    >
                      <div className="pt-6 px-6 flex w-full items-center justify-between space-x-6">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                        <div className="flex-1 truncate">
                          <div className="flex items-center space-x-3">
                            <h3 className="truncate text-lg font-medium text-zinc-900">
                              {file.name}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 mt-4 grid grid-cols-3 place-items-center py-2 gap-6 text-xs text-zinc-500">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {format(new Date(file.createdAt), "MMM yyyy")}
                      </div>

                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {file.uploadStatus === 'PROCESSING' ? 'processing' : 'success'}
                      </div>

                      <Button
                        onClick={() => deleteChatFile({ fileId: file.id, chatId })}
                        size="sm"
                        className="w-full"
                        variant="destructive"
                      >
                        {currentlyDeletingFile === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </li>
                ))}
            </ul>
          ) : isLoading ? (
            <Skeleton height={100} className="my-2" count={3} />
          ) : (
            <div className="mt-16 flex flex-col items-center gap-2">
              <Ghost className="h-8 w-8 text-zinc-800" />
              <h3 className="font-semibold text-xl">Pretty empty around here</h3>
              <p>Let&apos;s upload your first PDF.</p>
            </div>
          )}
        </main>
      </DialogContent>
    </Dialog>
  )

}

export default UploadDocsModal;
