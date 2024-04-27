import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextRequest } from "next/server";

import { NewChatValidator } from "@/lib/validators/NewChatValidator";

export const POST = async (req: NextRequest) => {
  // endpoint for asking a question to a pdf file

  const body = await req.json();

  const { getUser } = getKindeServerSession();
  const user = getUser();

  const { id: userId } = user;

  if (!userId) return new Response("Unauthorized", { status: 401 });


  const { fileId, message, chatType } = NewChatValidator.parse(body);

  if (chatType === "DOCUMENT") {
    const file = await db.file.findFirst({
      where: {
        id: fileId,
        userId,
      },
    });

    if (!file) return new Response("Not found", { status: 404 });
  }

  let chat
  chat = await db.chat.create({
    data: {
      chatName: message,
      fileId,
      userId

    }
  })




  return new Response(JSON.stringify({ chatId: chat.id }))


};
