import React from 'react';

import { MainContent } from '@/components/MainContent';
import { SidebarDesktop } from '@/components/sidebar/sidebar-desktop';

const Layout: React.FC<{ children: React.ReactNode }> = async ({ children }) => {


  return (
    <>
      <div className="flex flex-col overflow-hidden">
        <div className="flex overflow-x-hidden">
          <SidebarDesktop />
          <MainContent>{children}</MainContent>
        </div>
      </div>
    </>
  );
};

export default Layout;
