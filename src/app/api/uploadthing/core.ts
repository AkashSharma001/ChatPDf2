import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";

import { PLANS } from "@/config/stripe";
import { getUserRole, getUserSubscriptionPlan } from "@/lib/stripe";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

type MiddlewareInput = {
  chatId?: string;
};

// Define the argument type for the middleware function
type MiddlewareArguments = {
  input?: MiddlewareInput;
};

const f = createUploadthing();

const middleware = async ({ input }: MiddlewareArguments) => {
  const { getUser } = getKindeServerSession();
  const user = getUser();
  if (!user || !user.id) throw new Error("Unauthorized");

  const subscriptionPlan = await getUserSubscriptionPlan();
  const isAdmin = await getUserRole();
  return { subscriptionPlan, userId: user.id, chatId: input?.chatId ? input.chatId : '', isAdmin };
};

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: {
    key: string;
    name: string;
    url: string;
  };
}) => {

  const isFileExist = await db.file.findFirst({
    where: {
      key: file.key,
    },
  });

  if (isFileExist) return;

  const createdFile = await db.file.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      url: `https://utfs.io/f/${file.key}`,
      uploadStatus: "PROCESSING",
    },
  });

  try {
    const response = await fetch(`https://utfs.io/f/${file.key}`);

    const blob = await response.blob();

    const loader = new PDFLoader(blob);

    const pageLevelDocs = await loader.load();

    const pagesAmt = pageLevelDocs.length;

    const { subscriptionPlan } = metadata;
    const { isSubscribed } = subscriptionPlan;

    const isProExceeded =
      pagesAmt > PLANS.find((plan) => plan.name === "Pro")!.pagesPerPdf;
    const isFreeExceeded =
      pagesAmt > PLANS.find((plan) => plan.name === "Free")!.pagesPerPdf;

    if ((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)) {
      await db.file.update({
        data: {
          uploadStatus: "FAILED",
        },
        where: {
          id: createdFile.id,
        },
      });
    }

    // vectorize and index entire document
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_DOCUMENT_INDEX!);

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });


    await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
      pineconeIndex,
      namespace: createdFile.id,
    });

    await db.file.update({
      data: {
        uploadStatus: "SUCCESS",
      },
      where: {
        id: createdFile.id,
      },
    });
  } catch (err) {
    await db.file.update({
      data: {
        uploadStatus: "FAILED",
      },
      where: {
        id: createdFile.id,
      },
    });
  }
};


const onCustomUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: {
    key: string;
    name: string;
    url: string;
  };
}) => {
  const isFileExist = await db.additionalFile.findFirst({
    where: {
      key: file.key,
    },
  });
  if (isFileExist) return;

  const createdFile = await db.additionalFile.create({
    data: {
      key: file.key,
      name: file.name,
      url: `https://utfs.io/f/${file.key}`,
      uploadStatus: "PROCESSING",
      chatId: metadata.chatId,
    },
  });

  try {
    const response = await fetch(`https://utfs.io/f/${file.key}`);

    const blob = await response.blob();

    const loader = new PDFLoader(blob);

    const pageLevelDocs = await loader.load();

    const pagesAmt = pageLevelDocs.length;

    const { subscriptionPlan } = metadata;
    const { isSubscribed } = subscriptionPlan;

    const isProExceeded =
      pagesAmt > PLANS.find((plan) => plan.name === "Pro")!.pagesPerPdf;
    const isFreeExceeded =
      pagesAmt > PLANS.find((plan) => plan.name === "Free")!.pagesPerPdf;

    if ((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)) {
      await db.additionalFile.update({
        data: {
          uploadStatus: "FAILED",
        },
        where: {
          id: createdFile.id,
        },
      });
    }

    // vectorize and index entire document
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_DOCUMENT_INDEX!);

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });



    await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
      pineconeIndex,
      namespace: metadata.chatId,
    });

    await db.additionalFile.update({
      data: {
        uploadStatus: "SUCCESS",
      },
      where: {
        id: createdFile.id,
      },
    });
  } catch (err) {
    await db.additionalFile.update({
      data: {
        uploadStatus: "FAILED",
      },
      where: {
        id: createdFile.id,
      },
    });
  }
};

export const ourFileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: "4MB" } }).input(z.object({ chatId: z.string().optional() }))
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ pdf: { maxFileSize: "16MB" } }).input(z.object({ chatId: z.string().optional() }))
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  customeUploader: f({ pdf: { maxFileSize: "16MB" } }).input(z.object({ chatId: z.string() }))
    .middleware(middleware)
    .onUploadComplete(onCustomUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
