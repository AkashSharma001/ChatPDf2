import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { PLANS } from "@/config/stripe";
import { db } from "@/db";
import { getUserSubscriptionPlan, stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { privateProcedure, publicProcedure, router } from "./trpc";

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = getUser();

    if (!user.id || !user.email) throw new TRPCError({ code: "UNAUTHORIZED" });

    // check if the user is in the database
    const dbUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });

    if (!dbUser) {
      // create user in db
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
        },
      });
    }

    return { success: true };
  }),
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId } = ctx;

    return await db.file.findMany({
      where: {
        userId,
      },
    });
  }),

  getChatIdFile: privateProcedure.input(
    z.object({
      chatId: z.string(),
    })
  ).query(async ({ input }) => {
    const chatId = input.chatId
    return await db.additionalFile.findMany({
      where: {
        chatId,
      },
    });
  }),

  createStripeSession: privateProcedure.mutation(async ({ ctx }) => {
    const { userId } = ctx;

    const billingUrl = absoluteUrl("/billing");

    if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });

    const dbUser = await db.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!dbUser) throw new TRPCError({ code: "UNAUTHORIZED" });

    const subscriptionPlan = await getUserSubscriptionPlan();

    if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripeCustomerId,
        return_url: billingUrl,
      });

      return { url: stripeSession.url };
    }

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: billingUrl,
      cancel_url: billingUrl,
      payment_method_types: ["card"],
      mode: "subscription",
      billing_address_collection: "auto",
      line_items: [
        {
          price: PLANS.find((plan) => plan.name === "Pro")?.price.priceIds.test,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
      },
    });

    return { url: stripeSession.url };
  }),

  getFileChatMessages: privateProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string().optional(),
        chatId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { fileId, cursor, chatId } = input;
      const limit = input.limit ?? INFINITE_QUERY_LIMIT;
      let file
      if (!!fileId) {
        file = await db.file.findFirst({
          where: {
            id: fileId,
            userId,
          },
        });

        if (!file || !chatId) throw new TRPCError({ code: "NOT_FOUND", message: "file not found" });
      }
      const chatIdWithoutQuotes = chatId.replace(/"/g, '');
      const chat = await db.chat.findFirst({
        where: {
          id: chatIdWithoutQuotes,
          fileId: fileId ? fileId : null,
        },
      });


      if (!chat) throw new TRPCError({ code: "NOT_FOUND", message: "chat not found" });

      const messages = await db.message.findMany({
        take: limit + 1,
        where: {
          fileId: fileId ? fileId : null,
          chatId: chatIdWithoutQuotes,
        },
        orderBy: {
          createdAt: "desc",
        },
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          isUserMessage: true,
          createdAt: true,
          text: true,
        },
      });
      let nextCursor: typeof cursor | undefined = undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages,
        nextCursor,
      };
    }),

  getChatMessages: privateProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string().optional(),
        chatType: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { fileId, cursor, chatType } = input;
      const limit = input.limit ?? INFINITE_QUERY_LIMIT;
      let file;
      if (chatType == "DOCUMENT") {
        file = await db.file.findFirst({
          where: {
            id: fileId,
            userId,
          },
        });

        if (!file) throw new TRPCError({ code: "NOT_FOUND" });
      }
      const messages = fileId
        ? await db.message.findMany({
          take: limit + 1,
          where: {
            fileId,
            userId,
          },
          orderBy: {
            createdAt: "desc",
          },
          cursor: cursor ? { id: cursor } : undefined,
          select: {
            id: true,
            isUserMessage: true,
            createdAt: true,
            text: true,
          },
        })
        : await db.message.findMany({
          take: limit + 1,
          where: {
            userId,
          },
          orderBy: {
            createdAt: "desc",
          },
          cursor: cursor ? { id: cursor } : undefined,
          select: {
            id: true,
            isUserMessage: true,
            createdAt: true,
            text: true,
          },
        });

      let nextCursor: typeof cursor | undefined = undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages,
        nextCursor,
      };
    }),

  getFileUploadStatus: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input, ctx }) => {
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId: ctx.userId,
        },
      });

      if (!file) return { status: "PENDING" as const };

      return { status: file.uploadStatus };
    }),

  getFile: privateProcedure
    .input(z.object({ key: z.string(), chatId: z.string().optional().nullish() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      let file
      if (!!input.chatId && input.chatId != '') {
        file = await db.additionalFile.findFirst({
          where: {
            key: input.key,
            chatId: input.chatId
          },
        });
      }
      else {
        file = await db.file.findFirst({
          where: {
            key: input.key,
            userId,
          },
        });
      }

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      return file;
    }),

  getChatFile: privateProcedure
    .input(z.object({ key: z.string(), chatId: z.string().optional().nullish() }))
    .mutation(async ({ input }) => {

      const file = await db.additionalFile.findFirst({
        where: {
          key: input.key,
          chatId: input.chatId
        },
      });

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      return file;
    }),

  getFileChats: privateProcedure
    .input(z.object({ fileId: z.string().optional(), }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      let chats;

      if (!!input.fileId) {
        chats = await db.chat.findMany({
          where: {
            userId,
            fileId: input.fileId,
          },
          orderBy: {
            updatedAt: "desc",
          },
        });
      } else {
        chats = await db.chat.findMany({
          where: {
            userId, // Matches the userId
            fileId: null, // Excludes chat records with a specified fileId
          },
          orderBy: {
            updatedAt: "desc", // Orders the results by updatedAt in descending order
          },
        });
      }

      if (!chats) throw new TRPCError({ code: "NOT_FOUND" });

      return chats;
    }),

  deleteFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      await db.file.delete({
        where: {
          id: input.id,
        },
      });

      return file;
    }),

  deleteChatFile: privateProcedure
    .input(z.object({ chatId: z.string(), fileId: z.string() }))
    .mutation(async ({ input }) => {

      const file = await db.additionalFile.findFirst({
        where: {
          chatId: input.chatId,
          id: input.fileId,

        },
      });

      if (!file) throw new TRPCError({ code: "NOT_FOUND" });

      await db.additionalFile.delete({
        where: {
          id: input.fileId,
          chatId: input.chatId,
        },
      });

      return file;
    }),

  deleteChat: privateProcedure
    .input(z.object({ chatId: z.string(), fileId: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      const chat = await db.chat.findFirst({
        where: {
          id: input.chatId,
          fileId: input.fileId !== '' ? input.fileId : null,
          userId
        }
      })

      if (!chat) throw new TRPCError({ code: "NOT_FOUND" })
      await db.chat.delete({
        where: {
          id: input.chatId
        }
      })
      return chat
    }),
});

export type AppRouter = typeof appRouter;
