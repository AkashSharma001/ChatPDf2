import {z} from "zod"

export const NewChatValidator = z.object({
    fileId: z.string().optional(),
    chatType: z.string(),
    message: z.string(),
})