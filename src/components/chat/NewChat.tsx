"use client";

import { buttonVariants } from "@/components/ui/button";
import { useSidebar } from "@/lib/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";


const NewChat = () => {
  const { fileId } = useParams();
  const { chatType } = useSidebar();
  const router = useRouter();


  const handleNewChatClick = () => {
    localStorage.setItem("newChatId", "");

    if (chatType === "DOCUMENT") {
      router.replace(`./${fileId}`);
    } else {
      localStorage.setItem('legalFilterData', '');
      window.location.replace(`./research`);

    }
  };

  return (
    <div className="px-2 my-4">
      <Link
        href={chatType === "DOCUMENT" ? `./${fileId}` : "./research"}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-10 w-full justify-center bg-[#1C48E7] px-4 shadow-none text-white hover:text-white cursor-pointer transition-colors hover:bg-[#1C48E7] dark:bg-[#1C48E7] dark:hover:bg-[#1C48E7]"
        )}
        onClick={handleNewChatClick}
      >
        Start A New Conversation
      </Link>
    </div>
  );
};

export default NewChat;
