import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatHistory } from "../chat/chat-history";
import { SidebarClose } from "./sidebar-close";


export const SidebarDesktop = async () => {

  return (
    <Sidebar className=" peer fixed lg:absolute inset-y-0 z-30  -translate-x-full border-r bg-muted duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex  w-[16rem]  xl:w-[20rem]">
      <div className="mt-[4rem] mx-auto lg:ml-auto lg:mr-0 ">
        <SidebarClose />
      </div>
      <ChatHistory />

      {/* <SidebarFooter className="m flex">
        <UserCard />
      </SidebarFooter> */}
    </Sidebar>
  );
};
