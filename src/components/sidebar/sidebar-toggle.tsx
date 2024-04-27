"use client";

import * as React from "react";

import { useSidebar } from "@/lib/hooks/use-sidebar";
import { usePathname } from "next/navigation";
import { IconSidebar } from "../Icons";
import { Button } from "../ui/button";

export function SidebarToggle() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const isDocumentPage = pathname.includes("/document");
  const isResearchPage = pathname.includes("/research");

  return (
    <>
      {(isDocumentPage || isResearchPage) && (
        <Button
          variant="ghoster"
          className="w-9 h-9 bg-transparent hover:bg-transparent p-0 lg:flex"
          onClick={() => {
            toggleSidebar();
          }}
        >
          <IconSidebar className="w-10 h-10" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      )}

    </>
  );
}
