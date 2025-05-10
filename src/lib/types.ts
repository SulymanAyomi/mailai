import { z } from "zod";

export interface SyncResponse {
    syncUpdatedToken: string;
    syncDeletedToken: string;
    ready: boolean;
}
export interface SyncUpdatedResponse {
    nextPageToken?: string;
    nextDeltaToken: string;
    records: EmailMessage[];
}

export const emailAddressSchema = z.object({
    name: z.string(),
    email: z.string(),
})
export const emailAddressSchema1 = z.object({
    name: z.string(),
    email: z.string(),
    id: z.string(),
})

export const draftEmailAddressSchema = z.object({
    name: z.string(),
    email: z.string()
})

export interface EmailGmailMessage {
    id: string;
    threadId: string
    bodySnippet: string
    from: string
    subject: string
    createdTime: string
    to: string
    hasAttachments: Boolean
    sysLabels: string[]
    cc: string;
    bcc: string,
    body: string,
    replyTo: string
}

export interface CreateDraft {

    body: string
    subject: string
    syncUpdate: string // "pending" | "synced" | "failed"
    starred: boolean | undefined
    from: { name: string, email: string }[]
    to: { name: string, email: string }[] | []
    cc: { name: string, email: string }[] | []
    bcc: { name: string, email: string }[] | []
    replyTo: { name: string, email: string }[] | []
    threadId: String | undefined
    reply_to_message_id: string | undefined
}

export interface EmailMessage {
    id: string;
    threadId: string;
    createdTime: string;
    lastModifiedTime?: string;
    sentAt?: string;
    receivedAt?: string;
    internetMessageId?: string;
    subject: string;
    sysLabels: Array<"junk" | "trash" | "sent" | "inbox" | "unread" | "flagged" | "important" | "draft">;
    keywords?: string[];
    sysClassifications?: Array<"personal" | "social" | "promotions" | "updates" | "forums">;
    sensitivity?: "normal" | "private" | "personal" | "confidential";
    meetingMessageMethod?: "request" | "reply" | "cancel" | "counter" | "other";
    from: EmailAddress;
    to: EmailAddress[];
    cc: EmailAddress[];
    bcc: EmailAddress[];
    replyTo?: EmailAddress[];
    hasAttachments: boolean;
    body?: string;
    bodySnippet?: string;
    attachments?: EmailAttachment[];
    inReplyTo?: string;
    references?: string;
    threadIndex?: string;
    internetHeaders?: EmailHeader[];
    nativeProperties?: Record<string, string>;
    folderId?: string;
    omitted?: Array<"threadId" | "body" | "attachments" | "recipients" | "internetHeaders">;
}

export interface EmailAddress {
    name: string;
    email: string;
}

export interface EmailAttachment {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    inline: boolean;
    contentId?: string;
    content?: string;
    contentLocation?: string;
}

export interface EmailHeader {
    name: string;
    value: string;
}



