import { Gmail } from "@/lib/gmail";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { Prisma } from "@prisma/client";
import { google } from "googleapis";
import { User } from "lucide-react";
import { z } from "zod";



export const authoriseAccountAccess = async (accountId: string, userId: string) => {
    const account = await db.userAccount.findFirst({
        where: {
            id: accountId,
            userId: userId,
        },
        select: {
            id: true, emailAddress: true, access_token: true
        }
    })
    if (!account) throw new Error("Invalid token")
    return account
}



const inboxFilter = (accountId: string): Prisma.ThreadWhereInput => ({
    userAccountId: accountId,
    inboxStatus: true
})

const sentFilter = (accountId: string): Prisma.ThreadWhereInput => ({
    userAccountId: accountId,
    sentStatus: true
})

const draftFilter = (accountId: string): Prisma.ThreadWhereInput => ({
    userAccountId: accountId,
    draftStatus: true
})

export const accountRouter = createTRPCRouter({
    getAccounts: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.db.userAccount.findMany({
            where: {
                userId: ctx.session.user.id
            },
            select: {
                id: true, emailAddress: true, name: true
            }
        })
    }),
    fetchAccount: protectedProcedure.query(async ({ ctx }) => {
        const user = ctx.session.user

        const user1 = await ctx.db.account.findFirst({
            where: {
                userId: user.id
            },
            select: {
                provider: true,
                access_token: true
            }
        })
        return user1

    }),
    fetchMail: protectedProcedure.input(z.object({
        access_token: z.string(),

    })).query(async ({ ctx, input }) => {
        try {
            const gmailAuth = new google.auth.OAuth2();
            gmailAuth.setCredentials({ access_token: input.access_token });
            console.log(input.access_token)
            const gmail = google.gmail({ version: "v1", auth: gmailAuth });

            const messages = await gmail.users.labels.list({
                userId: 'me',
            });
            // await gmail.users.messages.list({ userId: "me", maxResults: 5 });
            // console.log(messages);
            const labels = messages.data.labels;
            if (!labels || labels.length === 0) {
                console.log('No labels found.');
                return;
            }
            console.log('Labels:');
            labels.forEach((label) => {
                console.log(`- ${label.name}`);
            });

            return {
                success: true,
            }
        } catch (error) {
            console.log(error);
        }


    }),
    getNumThreads: protectedProcedure.input(z.object({
        accountId: z.string(),
        tab: z.string()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.session.user.id)
        let filter: Prisma.ThreadWhereInput = {}
        if (input.tab === "inbox") {
            filter = inboxFilter(account.id)
        } else if (input.tab === "sent") {
            filter = sentFilter(account.id)
        } else if (input.tab === "drafts") {
            filter = draftFilter(account.id)
        }
        return await ctx.db.thread.count({
            where: filter
        })
    }),
    getThreads: protectedProcedure.input(z.object({
        accountId: z.string(),
        tab: z.string(),
        done: z.boolean()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.session.user.id)

        let filter: Prisma.ThreadWhereInput = {}
        if (input.tab === "inbox") {
            filter = inboxFilter(account.id)
        } else if (input.tab === "sent") {
            filter = sentFilter(account.id)
        } else if (input.tab === "drafts") {
            filter = draftFilter(account.id)
        }

        filter.done = {
            equals: input.done
        }

        const threads = await ctx.db.thread.findMany({
            where: filter,
            include: {
                emails: {
                    orderBy: {
                        sentAt: "asc"
                    },
                    select: {
                        from: true,
                        body: true,
                        bodySnippet: true,
                        emailLabel: true,
                        subject: true,
                        sysLabels: true,
                        id: true,
                        sentAt: true
                    }
                }
            },
            take: 15,
            orderBy: {
                lastMessageDate: "desc"
            }
        })
        return threads
    }),
    getSuggestions: protectedProcedure.input(z.object({
        accountId: z.string(),
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.session.user.id)
        return await ctx.db.emailAddress.findMany({
            where: {
                userAccountId: account.id
            },
            select: {
                address: true,
                name: true
            }
        })

    }),
    getReplyDetails: protectedProcedure.input(z.object({
        accountId: z.string(),
        threadId: z.string(),
        replyType: z.enum(['reply', 'replyAll'])
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.session.user.id)

        const thread = await ctx.db.thread.findUnique({
            where: { id: input.threadId },
            include: {
                emails: {
                    orderBy: { sentAt: 'asc' },
                    select: {
                        from: true,
                        to: true,
                        cc: true,
                        bcc: true,
                        sentAt: true,
                        subject: true,
                        internetMessageId: true,
                    },
                },
            },
        });

        if (!thread || thread.emails.length === 0) {
            throw new Error("Thread not found or empty");
        }

        const lastExternalEmail = thread.emails
            .reverse()
            .find(email => email.from.id !== account.id);

        if (!lastExternalEmail) {
            throw new Error("No external email found in thread");
        }

        const allRecipients = new Set([
            ...thread.emails.flatMap(e => [e.from, ...e.to, ...e.cc]),
        ]);

        if (input.replyType === 'reply') {
            return {
                to: [lastExternalEmail.from],
                cc: [],
                from: { name: account.name, address: account.emailAddress },
                subject: `${lastExternalEmail.subject}`,
                id: lastExternalEmail.internetMessageId
            };
        } else if (input.replyType === 'replyAll') {
            return {
                to: [lastExternalEmail.from, ...lastExternalEmail.to.filter(addr => addr.id !== account.id)],
                cc: lastExternalEmail.cc.filter(addr => addr.id !== account.id),
                from: { name: account.name, address: account.emailAddress },
                subject: `${lastExternalEmail.subject}`,
                id: lastExternalEmail.internetMessageId
            };
        }
    }),

})
