"use client";

import { trpc } from "@/app/_trpc/client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Chat, SidebarItems } from "./sidebarItems";

interface SidebarListsProps {
  userId?: string;
}

export function SidebarLists({ userId }: SidebarListsProps) {
  const [chats, setChats] = useState<Chat[]>([]);


  const { fileId } = useParams();



  const { data: fetchedChats, isLoading } = trpc.getFileChats.useQuery({
    fileId: fileId as string,
  });

  useEffect(() => {
    if (!isLoading && fetchedChats) {
      setChats(fetchedChats);
    }
  }, [isLoading, fetchedChats]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-[0.75] lg:flex-1 overflow-auto">
        {chats?.length ? (
          <div className="h-[60vh] space-y-2 px-2">
            <SidebarItems chats={chats} />
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No chat history</p>
          </div>
        )}
      </div>
    </div>
  );
}
