import { db } from "@/db";
import { openai } from "@/lib/openai";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { NextRequest } from "next/server";

import { OpenAIStream, StreamingTextResponse } from "ai";
export const POST = async (req: NextRequest) => {

  // endpoint for asking a question to a pdf file

  const body = await req.json();

  const { getUser } = getKindeServerSession();
  const user = getUser();

  const { id: userId } = user;

  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { fileId, message, chatType, chatId, legalFilter } =
    SendMessageValidator.parse(body);


  let file;
  try {

    if (chatType == "DOCUMENT") {
      file = await db.file.findFirst({
        where: {
          id: fileId,
          userId,
        },
      });

      if (!file) return new Response("Not found", { status: 404 });
    }
    await db.message.create({
      data: {
        text: message,
        isUserMessage: true,
        userId,
        chatId,
        fileId: fileId ? fileId : null,
      },
    });

    // 1: vectorize message
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const pinecone = new Pinecone();
    const mainIndex = pinecone.Index(process.env.PINECONE_RESEARCH_INDEX!);
    const documentIndex = pinecone.Index(process.env.PINECONE_DOCUMENT_INDEX!);

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: mainIndex,
      filter: createFilter(legalFilter).filter
    });

    const stateName = createFilter(legalFilter).stateName
    const mainResults = await vectorStore.similaritySearch(message, 4);
    const refDocumentVectorStore = await PineconeStore.fromExistingIndex(
      embeddings,
      {
        pineconeIndex: documentIndex,
        namespace: chatId,
      }
    );

    const refDocumentResult = await refDocumentVectorStore.similaritySearch(
      message,
      2
    );

    let prevMessages;
    if (chatType == "DOCUMENT") {
      prevMessages = await db.message.findMany({
        where: {
          chatId
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      });
    } else {
      prevMessages = await db.message.findMany({
        where: {
          chatId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
      });
    }
    const formattedPrevMessages = prevMessages.map((msg) => ({
      role: msg.isUserMessage ? ("user" as const) : ("assistant" as const),
      content: msg.text,
    }));

    let response;
    if (chatType == "RESEARCH") {
      response = await openai.chat.completions.create({
        model: "gpt-4",
        temperature: 0,
        stream: true,
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content:
              "Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.",
          },
          {
            role: "user",
            content: `You are a legal assistant for ${stateName}. You will stick to the information you query from the knowledge base provided first. Carefully assess what the person is asking, and then provide an in depth answer and lay it out so it's easy to decipher and analyze. After every response, you should also invite the user to ask more questions relevant to the first topic. You should also provide one or two example questions.

  \n----------------\n

  PREVIOUS CONVERSATION:
  ${formattedPrevMessages.map((message) => {
              if (message.role === "user") return `User: ${message.content}\n`;
              return `Assistant: ${message.content}\n`;
            })}

  \n----------------\n

  CONTEXT:

  ${refDocumentResult.map((r) => r.pageContent).join("\n\n")}\n\n

  ${mainResults.map((r) => r.pageContent).join("\n\n")}

  USER INPUT: ${message}`,
          },
        ],
      });
    } else {
      const namespace = file?.id ?? "default";

      const documentVectorStore = await PineconeStore.fromExistingIndex(
        embeddings,
        {
          pineconeIndex: documentIndex,
          namespace,
        }
      );

      const documentResult = await documentVectorStore.similaritySearch(
        message,
        2
      );

      response = await openai.chat.completions.create({
        model: "gpt-4",
        temperature: 0,
        stream: true,
        messages: [
          {
            role: "system",
            content:
              "Use the following pieces of context and knowledge base (or previous conversaton if needed) to answer the users question in markdown format.",
          },
          {
            role: "user",
            content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question you can take help from knowledge base if info not in context.

  \n----------------\n

  PREVIOUS CONVERSATION:
  ${formattedPrevMessages.map((message) => {
              if (message.role === "user") return `User: ${message.content}\n`;
              return `Assistant: ${message.content}\n`;
            })}

  \n----------------\n


  CONTEXT:
  ${documentResult.map((r) => r.pageContent).join("\n\n")}

  \n----------------\n


  KNOWLEDGE BASE:
  ${mainResults.map((r) => r.pageContent).join("\n\n")} \n

  USER INPUT: ${message}
`,
          },
        ],
      });
    }

    const stream = OpenAIStream(response, {
      async onCompletion(completion) {
        if (chatType == "DOCUMENT") {
          await db.message.create({
            data: {
              text: completion,
              isUserMessage: false,
              fileId: fileId || null,
              chatId,
              userId,
            },
          });
        } else {
          await db.message.create({
            data: {
              text: completion,
              isUserMessage: false,
              chatId,
              userId,
            },
          });
        }
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {

    await db.message.create({
      data: {
        text: 'Error occurred. Please try again.',
        isUserMessage: false,
        chatId,
        userId,
      },
    });

    return new StreamingTextResponse(
      new ReadableStream({
        start(controller) {
          controller.enqueue('Error occurred. Please try again.');
          controller.close();
        },
      })
    );
  }
};

const createFilter = (legalFilter: any) => {
  let filter = {};
  let stateName = '';

  if (!!legalFilter) {
    if (!legalFilter.allData) {
      if (legalFilter.allFederal) {
        filter = { 'main': { '$eq': 'fedral' } };
        stateName = 'Federal';
      } else if (legalFilter.allFederalCases) {
        filter = { 'main': { '$eq': 'fedral' }, 'type': { '$eq': 'case' } };
        stateName = 'Federal';
      } else if (legalFilter.allFederalCasesSelected && legalFilter.allFederalCasesSelected.length > 0) {
        filter = {
          'main': { '$eq': 'fedral' },
          'type': { '$eq': 'case' },
          'state': { '$in': legalFilter.allFederalCasesSelected.map((state: string) => state.replace(' ', '_')) }
        };
        stateName = legalFilter.allFederalCasesSelected.join(', ');
      } else if (legalFilter.allFederalRule) {
        filter = {
          'main': { '$eq': 'fedral' },
          'type': { '$eq': 'regulation' },
        };
        stateName = 'Federal';
      } else if (!!legalFilter.allFederalRuleSelected && legalFilter.allFederalRuleSelected.length > 0) {
        filter = {
          'main': { '$eq': 'fedral' },
          'type': { '$eq': 'rule' },
          'state': { '$in': legalFilter.allFederalRuleSelected }
        };
        stateName = legalFilter.allFederalRuleSelected.join(', ');
      } else if (legalFilter.allFederalSR) {
        filter = {
          'main': { '$eq': 'fedral' },
          'type': { '$eq': ['statute', 'regulation'] }
        };
        stateName = 'Federal';
      } else if (legalFilter.allFederalSRR) {
        filter = {
          'main': { '$eq': 'fedral' },
          'type': { '$eq': ['statute', 'regulation', 'rule'] },
        };
        stateName = 'Federal';
      } else if (legalFilter.allFederalSRSelected && legalFilter.allFederalSRSelected.length > 0) {
        filter = {
          'main': { '$eq': 'fedral' },
          'type': { '$eq': ['statute', 'regulation'] },
          'state': { '$in': legalFilter.allFederalSRSelected }
        };
        stateName = legalFilter.allFederalSRSelected.join(', ');
      } else if (legalFilter.allState) {
        filter = {
          'main': { '$eq': 'state' },
        };
        stateName = 'State';
      } else if (legalFilter.allStateCases) {
        filter = {
          'main': { '$eq': 'state' },
          'type': { '$eq': 'case' },
        };
        stateName = 'State';
      } else if (legalFilter.allStateCasesSelected && legalFilter.allStateCasesSelected.length > 0) {
        filter = {
          'main': { '$eq': 'state' },
          'type': { '$eq': 'case' },
          'state': { '$in': legalFilter.allStateCasesSelected.map((state: string) => state.replace(' ', '_')) }
        };
        stateName = legalFilter.allStateCasesSelected.join(', ');
      } else if (legalFilter.allStateSRR) {
        filter = {
          'main': { '$eq': 'state' },
          'type': { '$eq': ['statute', 'regulation', 'rule'] }
        };
        stateName = 'State';
      } else if (legalFilter.allStateSRRSelected && legalFilter.allStateCasesSelected.length > 0) {
        filter = {
          'main': { '$eq': 'state' },
          'type': { '$eq': ['statute', 'regulation', 'rule'] },
          'state': { '$in': legalFilter.allStateSRRSelected }
        };
        stateName = legalFilter.allStateSRRSelected.join(', ');
      } else if (legalFilter.allStateSRRStateSelected && legalFilter.allStateCasesSelected.length > 0) {
        filter = {
          'main': { '$eq': 'state' },
          'type': { '$eq': ['statute', 'regulation', 'rule'] },
          'state': { '$in': legalFilter.allStateSRRStateSelected }
        };
        stateName = legalFilter.allStateSRRStateSelected.join(', ');
      }
    }
  }

  return { filter, stateName };
};
