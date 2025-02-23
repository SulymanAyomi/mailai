import "server-only"
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { google } from "googleapis";
import { RouterOutputs } from '@/trpc/react';

interface GmailType {
    serviceType?: 'Gmail' | 'Outlook';
    user: {
        access_token: string,
        provider: string
    }
}

export class GmailAccount {
    private access_token: string

    constructor(access_token: string) {
        this.access_token = access_token;
    }
    private decodeEmail(bodyData: string) {
        const emailBody = Buffer.from(bodyData, "base64").toString("utf-8");
        return emailBody
    }
    private Email(arr) {
        const c = arr.find((t) => t.mimeType === "text/html")
        return c.body.data
    }
    async startSync() {
        const gmailAuth = new google.auth.OAuth2();
        console.log(this.access_token);
        gmailAuth.setCredentials({ access_token: this.access_token });
        const gmail = google.gmail({ version: "v1", auth: gmailAuth });
        try {

            const messages = await gmail.users.messages.list({ userId: "me", maxResults: 10 });

            if (!messages.data.messages) {
                return "No messages";
            }
            const emailDetails = await Promise.all(
                messages.data.messages.map(async (message) => {
                    const msg = await gmail.users.messages.get({ userId: "me", id: message?.id as string, format: "full" });
                    return {
                        id: msg?.data.id as string,
                        threadId: msg?.data.threadId as string,
                        bodySnippet: msg.data.snippet as string,
                        from: msg.data.payload?.headers?.find((h) => h.name === "From")?.value as string || "Unknown" as string,
                        subject: msg.data.payload?.headers?.find((h) => h.name === "Subject")?.value as string || "No Subject",
                        createdTime: msg.data.payload?.headers?.find((h) => h.name === "Date")?.value as string,
                        to: msg.data.payload?.headers?.find((h) => h.name === "Delivered-To")?.value as string,
                        hasAttachments: false,
                        sysLabels: msg.data.labelIds as [string],
                        cc: msg.data.payload?.headers?.find((h) => h.name === "cc")?.value as string || "",
                        bcc: msg.data.payload?.headers?.find((h) => h.name === "bcc")?.value as string || "",
                        body: this.Email(msg.data.payload?.parts) as string,
                        replyTo: ""
                    }

                }
                ))
            return { emails: emailDetails, }
        } catch (error) {
            console.error("Error fetching emails:", error);
        }
    }
}

