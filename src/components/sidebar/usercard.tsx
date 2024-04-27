import { getUserSubscriptionPlan } from "@/lib/stripe";
import {
  LogoutLink,
  getKindeServerSession,
} from "@kinde-oss/kinde-auth-nextjs/server";
import { Gem } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { IconDot, IconThreeDot, Icons } from "../Icons";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const UserCard = async () => {
  const { getUser } = getKindeServerSession();
  const user = getUser();
  const subscriptionPlan = await getUserSubscriptionPlan();

  return (
    <div className="flex items-center bg-white justify-center w-[20rem] border-2 border-[#edf0ff] px-2 py-3 rounded-xl">
      <div className="flex items-center ">
        <Avatar className="relative h-[2.85rem] w-[2.85rem] ">
          {user.picture ? (
            <div className="relative aspect-square h-full w-full">
              <Image
                fill
                src={user.picture}
                alt="profile picture"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <AvatarFallback>
              <span className="sr-only">{user.given_name}</span>
              <Icons.user className="h-4 w-4 text-zinc-900" />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="ms-3">
          <h3 className="font-semibold text-gray-800 dark:text-white ml-1">
            {`${user.given_name} ${user.family_name}`}
          </h3>
          <div className="flex bg-[#1C48E7] h-5 justify-center items-center w-[6.5rem] rounded-2xl">
            <IconDot />
            <p className="text-sm font-medium text-white pr-2  ">
              <span className="capitalize">
                {subscriptionPlan?.isSubscribed ? "Pro plan" : "Free plan"}
              </span>
            </p>
          </div>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="overflow-visible">
          <button className="bg-[#1C48E7] rounded-lg w-7 h-7 xl:w-8 xl:h-8 ml-auto flex items-center justify-center">
            <IconThreeDot />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="bg-white" align="end">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-0.5 leading-none">
              {user.given_name && (
                <p className="font-medium text-sm text-black">
                  {`${user.given_name} ${user.family_name}`}
                </p>
              )}
              {user.email && (
                <p className="w-[200px] truncate text-xs text-zinc-700">
                  {user.email}
                </p>
              )}
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href="/dashboard">Dashboard</Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            {subscriptionPlan?.isSubscribed ? (
              <Link href="/billing">Manage Subscription</Link>
            ) : (
              <Link href="/pricing">
                Upgrade <Gem className="text-blue-600 h-4 w-4 ml-1.5" />
              </Link>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="cursor-pointer">
            <LogoutLink>Log out</LogoutLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserCard;
