"use client";

import * as React from "react";

import { useSidebar } from "@/lib/hooks/use-sidebar";
import { cn } from "@/lib/utils";

export function MainContent({ className, children }: React.ComponentProps<"div">) {
  const { isSidebarOpen, chatType } = useSidebar();

  return (
    <>
      <div
        className={cn(
          `flex-1  ${
            chatType !== "DOCUMENT" ? "pt-0" : "pt-6 lg:pt-0"
          } lg:justify-evenly lg:flex-row flex-col h-[calc(100vh-3.5rem)] flex ${
            isSidebarOpen ? "lg:ml-[16rem] xl:ml-[20rem]" : " "
          }`,
          className
        )}
      >
        {children}
      </div>
    </>
  );
}
