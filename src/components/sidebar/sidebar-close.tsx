"use client";

import * as React from "react";

import { useSidebar } from "@/lib/hooks/use-sidebar";
import { IconCross } from "../Icons";



export function SidebarClose() {
  const { toggleSidebar } = useSidebar();

  return (
    <>
      <div className="flex justify-end mb-4 pr-2">
        <button className="bg-[#1C48E7] w-8 h-8 p-2 rounded-lg" onClick={toggleSidebar}>
          <IconCross />
        </button>
      </div>
    </>
  );
}
