'use client';

import { useSidebar } from "@/lib/hooks/use-sidebar";
import Link from "next/link";
import { buttonVariants } from "./ui/button";

const ActiveTypeLink: React.FC<{ children?: React.ReactNode, target: boolean, label: boolean, className?: string }> = ({ children, target = false, className, label = true }) => {
  const { chatType } = useSidebar();

  let href = '/';
  let linkLabel = '';

  if (chatType === 'DOCUMENT') {
    href = '/document';
    linkLabel = 'Document';
  } else if (chatType === 'RESEARCH') {
    href = '/research';
    linkLabel = 'Research';
  } else {
    linkLabel = 'Dashboard';
  }

  return (
    <Link
      href={href}
      className={className ? className : buttonVariants({
        variant: "ghost",
        size: "sm",
      })}
    >
      {label && linkLabel}
      {children}
    </Link>
  );
};

export default ActiveTypeLink;
