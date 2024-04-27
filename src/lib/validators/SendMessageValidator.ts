import { z } from "zod";

export const SendMessageValidator = z.object({
  fileId: z.string().optional(),
  message: z.string(),
  chatType: z.string(),
  chatId: z.string(),
  legalFilter: z.any()
});
