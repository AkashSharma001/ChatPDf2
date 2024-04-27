import { trpc } from "@/app/_trpc/client";
import { INFINITE_QUERY_LIMIT } from "@/config/infinite-query";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ReactNode,
  createContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useToast } from "../ui/use-toast";

type StreamResponse = {
  addMessage: () => void;
  message: string;
  chatId: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  fetchChat: (msg: string) => Promise<string>;
};

export const ChatContext = createContext<StreamResponse>({
  addMessage: () => { },
  message: "",
  chatId: "",
  handleInputChange: () => { },
  isLoading: false,
  fetchChat: async () => "",
});

interface Props {
  fileId?: string;
  chatType: string;
  children: ReactNode;
}

export const ChatContextProvider = ({ fileId, children, chatType }: Props) => {
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const s = useSearchParams();
  const cid = s.get("cid") ? (s.get("cid") as string) : '';
  const storedChatId = JSON.stringify(localStorage.getItem("newChatId") as string);

  const storedLegalFliterData = JSON.parse(localStorage.getItem('legalFilterData') as string);
  const chatId = storedChatId ? storedChatId.replace(/"/g, "") : '';
  const router = useRouter();
  const utils = trpc.useUtils();

  const { toast } = useToast();
  const backupMessage = useRef("");

  const fetchChatId = async (msg: string) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        fileId,
        message: msg,
        chatType,
      }),
    });
    const data = await response.json();

    localStorage.setItem("newChatId", cid);

    router.replace(`?cid=${data.chatId}`);
    return data.chatId as string;
  };
  useEffect(() => {
    if (chatId === "") {
      const test = s.get("cid") ? (s.get("cid") as string) : "";


    } else {
      localStorage.setItem("newChatId", cid);

    }
  }, []);

  useEffect(() => {
    localStorage.setItem("newChatId", cid);

  }, [cid]);

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ message, cid }: { message: string; cid?: string }) => {

      const response = await fetch("/api/message", {
        method: "POST",
        body: JSON.stringify({
          fileId: fileId ? fileId : '',
          chatType,
          message,
          chatId: cid,
          legalFilter: storedLegalFliterData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      return response.body;
    },
    onMutate: async ({ message, cid }) => {
      backupMessage.current = message;
      setMessage("");
      // Conditional cancellation

      await utils.getFileChatMessages.cancel();

      // Step 2: Retrieve previous messages
      const previousMessages = utils.getFileChatMessages.getInfiniteData();

      utils.getFileChatMessages.setInfiniteData(
        {
          chatId: cid ? cid.replace(/"/g, "") : chatId.replace(/"/g, "") as string,
          fileId: fileId ? fileId : "",
          limit: INFINITE_QUERY_LIMIT,
        },
        (old) => {

          if (!old) {
            return {
              pages: [],
              pageParams: [],
            };
          }

          const newPages = [...old.pages];

          const latestPage = newPages[0]!;



          latestPage.messages = [
            {
              createdAt: new Date().toISOString(),
              id: crypto.randomUUID(),
              text: message,
              isUserMessage: true,
            },
            ...latestPage.messages,
          ];

          newPages[0] = latestPage;

          return {
            ...old,
            pages: newPages,
          };
        },
      );

      setIsLoading(true);

      return {
        previousMessages:
          previousMessages?.pages.flatMap((page) => page.messages) ?? [],
      };
    },
    onSuccess: async (stream) => {
      setIsLoading(false);
      utils.getFileChats.invalidate()
      if (!stream) {
        return toast({
          title: "There was a problem sending this message",
          description: "Please refresh this page and try again",
          variant: "destructive",
        });
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let done = false;

      // accumulated response
      let accResponse = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);

        accResponse += chunkValue;

        utils.getFileChatMessages.setInfiniteData(
          {
            chatId: cid ? cid.replace(/"/g, "") : chatId.replace(/"/g, ""),
            fileId: fileId ? fileId : "",
            limit: INFINITE_QUERY_LIMIT,
          },
          (old) => {
            if (!old) return { pages: [], pageParams: [] };

            const isAiResponseCreated = old.pages.some((page) =>
              page.messages.some((message) => message.id === "ai-response"),
            );


            const updatedPages = old.pages.map((page) => {
              if (page === old.pages[0]) {
                let updatedMessages;

                if (!isAiResponseCreated) {
                  updatedMessages = [
                    {
                      createdAt: new Date().toISOString(),
                      id: "ai-response",
                      text: accResponse,
                      isUserMessage: false,
                    },
                    ...page.messages,
                  ];
                } else {
                  updatedMessages = page.messages.map((message) => {
                    if (message.id === "ai-response") {
                      return {
                        ...message,
                        text: accResponse,
                      };
                    }
                    return message;
                  });
                }

                return {
                  ...page,
                  messages: updatedMessages,
                };
              }

              return page;
            });

            return { ...old, pages: updatedPages };
          },
        );
      }
    },

    onError: (_, __, context) => {
      setMessage(backupMessage.current);

      utils.getFileChatMessages.setData(
        { fileId: fileId || "", chatId: chatId.replace(/"/g, "") },
        { messages: context?.previousMessages ?? [] },
      );
    },
    onSettled: async () => {
      setIsLoading(false);

      await utils.getFileChatMessages.invalidate({ chatId });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  let fetchCid: string = "";
  const addMessage = async () => {

    if ((chatId == "" || !chatId) && !cid) {
      fetchCid = await fetchChatId(message);

      const intervalId = setInterval(() => {
        clearInterval(intervalId);


      }, 2500); // Adjust the interval as needed
    } else {


      sendMessage({ message, cid: cid.replace(/"/g, "") });
    }
  };
  return (
    <ChatContext.Provider
      value={{
        addMessage,
        message,
        handleInputChange,
        isLoading,
        chatId: fetchCid != "" ? fetchCid : cid.replace(/"/g, ""),
        fetchChat: fetchChatId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
