
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { SidebarLists } from "./sidebar-lists";





export async function SidebarList() {



  const { getUser } = getKindeServerSession();
  const user = getUser();




  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-[0.75] lg:flex-1 overflow-auto">
        <SidebarLists userId={user.id as string} />
      </div>
    </div >
  )
}
