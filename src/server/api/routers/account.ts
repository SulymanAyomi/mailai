import { createDraft, deleteNylasDraft, deleteThread, sendNylasDraft, updateNylasDraft } from "@/lib/nylas";
import { CreateDraft, draftEmailAddressSchema, emailAddressSchema, emailAddressSchema1 } from "@/lib/types";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "@/server/api/trpc";
import { db } from "@/server/db";
import { Draft, Prisma } from "@prisma/client";
import { User } from "lucide-react";
import { threadId } from "worker_threads";
import { z } from "zod";



export const authoriseAccountAccess = async (accountId: string, userId: string) => {
    const account = await db.userAccount.findFirst({
        where: {
            id: accountId,
            userId: userId,
        },
        select: {
            id: true, emailAddress: true, access_token: true, name: true, grant: true
        }
    })
    if (!account) throw new Error("Invalid token")
    return account
}



const inboxFilter = (accountId: string): Prisma.ThreadWhereInput => ({
    userAccountId: accountId,
    folders: {
        has: 'INBOX'
    }
})

const sentFilter = (accountId: string): Prisma.ThreadWhereInput => ({
    userAccountId: accountId,
    folders: {
        has: 'SENT'
    }
})

const draftFilter = (accountId: string): Prisma.ThreadWhereInput => ({
    userAccountId: accountId,
    hasDrafts: true
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
    getCurrentUserEmail: protectedProcedure.input(z.object({
        accountId: z.string(),
        email: z.string()
    })).query(async ({ ctx, input }) => {
        return await ctx.db.emailAddress.findFirst({
            where: {
                userAccountId: input.accountId,
                email: input.email
            },
            select: {
                id: true, name: true, email: true
            }
        })
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
        }
        else if (input.tab === "drafts") {
            return await ctx.db.draft.count()
        }
        return await ctx.db.thread.count({
            where: filter
        })
    }),
    getThreads: protectedProcedure.input(z.object({
        accountId: z.string(),
        tab: z.string(),
        unread: z.boolean()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.session.user.id)

        console.log(account, "account fetched")

        let filter: Prisma.ThreadWhereInput = {}
        if (input.tab === "inbox") {
            filter = inboxFilter(account.id)
        } else if (input.tab === "sent") {
            filter = sentFilter(account.id)
        } else if (input.tab === "drafts") {
            return []
        }
        if (input.unread) {
            filter.done = {
                equals: input.unread
            }
        }
        const threads = await ctx.db.thread.findMany({
            where: filter,
            include: {
                emails: {
                    orderBy: {
                        createdTime: "asc"
                    },
                    select: {
                        from: true,
                        body: true,
                        bodySnippet: true,
                        emailLabel: true,
                        subject: true,
                        folders: true,
                        id: true,
                        createdTime: true,
                        cc: true,
                        bcc: true,
                        to: true,
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
    getDrafts: protectedProcedure.input(z.object({
        accountId: z.string(),
        tab: z.string(),
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.session.user.id)

        if (input.tab === "drafts") {
            return await ctx.db.draft.findMany({
                where: {
                    accountId: account.id
                },
                take: 15
            })
        }
        return []
    }),
    getEmailSuggestions: protectedProcedure.input(z.object({
        accountId: z.string(),
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.session.user.id)
        return await ctx.db.emailAddress.findMany({
            where: {
                userAccountId: account.id
            },
            select: {
                email: true,
                name: true
            }
        })

    }),
    getReplyDetails: protectedProcedure.input(z.object({
        accountId: z.string(),
        threadId: z.string(),
        replyType: z.enum(['reply', 'replyAll', "forward"])
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.session.user.id)

        const thread = await ctx.db.thread.findUnique({
            where: { id: input.threadId },
            include: {
                emails: {
                    orderBy: { createdTime: 'asc' },
                    select: {
                        from: true,
                        to: true,
                        cc: true,
                        bcc: true,
                        createdTime: true,
                        subject: true,
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
                from: { name: account.name, email: account.emailAddress },
                subject: `${lastExternalEmail.subject}`,
            };
        } else if (input.replyType === 'replyAll') {
            return {
                to: [lastExternalEmail.from, ...lastExternalEmail.to.filter(addr => addr.id !== account.id)],
                cc: lastExternalEmail.cc.filter(addr => addr.id !== account.id),
                from: { name: account.name, email: account.emailAddress },
                subject: `${lastExternalEmail.subject}`,
            };
        }
    }),
    getMyAccount: protectedProcedure.input(z.object({
        accountId: z.string()
    })).query(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.session.user.id)
        return account
    }),
    sendEmail: protectedProcedure.input(z.object({
        accountId: z.string(),
        body: z.string(),
        subject: z.string(),
        from: emailAddressSchema,
        to: z.array(draftEmailAddressSchema),
        cc: z.array(draftEmailAddressSchema).optional(),
        bcc: z.array(draftEmailAddressSchema).optional(),
        replyTo: emailAddressSchema,
        inReplyTo: z.string().optional(),
        threadId: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
        const acc = await authoriseAccountAccess(input.accountId, ctx.session.user.id)
        // const account = new Account(acc.token)
        // console.log('sendmail', input)
        // await account.sendEmail({
        //     body: input.body,
        //     subject: input.subject,
        //     threadId: input.threadId,
        //     to: input.to,
        //     bcc: input.bcc,
        //     cc: input.cc,
        //     replyTo: input.replyTo,
        //     from: input.from,
        //     inReplyTo: input.inReplyTo,
        // })
    }),
    TrashMail: protectedProcedure.input(z.object({
        id: z.string(),
        accountId: z.string(),

    })).mutation(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.session.user.id)
        const id = input.id
        const accountId = account.id
        const grant = account.grant
        const thread = await ctx.db.thread.findUnique({
            where: { id, userAccountId: accountId }
        })

        if (!thread) return {
            success: false,
            message: "Mail not found!"
        }

        const res = await deleteThread(grant, thread.id)
        if (!res.success) {
            return {
                success: false,
                message: "unable to delete mail"
            }
        }
        return {
            success: true,
            message: "Mail deleted successfully"
        }
    }),
    saveDraft: protectedProcedure.input(z.object({
        accountId: z.string(),
        body: z.string(),
        subject: z.string(),
        fromId: z.string(),
        new: z.boolean(),
        to: z.array(draftEmailAddressSchema).optional(),
        cc: z.array(draftEmailAddressSchema).optional(),
        bcc: z.array(draftEmailAddressSchema).optional(),
        replyTo: z.array(draftEmailAddressSchema).optional(),
        inReplyTo: z.string().optional(),
        threadId: z.string().optional(),
        draftId: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
        try {


            const acc = await authoriseAccountAccess(input.accountId, ctx.session.user.id)
            console.log('sendmail', input)

            const to = input.to ?? []
            const cc = input.cc ?? []
            const bcc = input.bcc ?? []
            const replyTo = input.replyTo ?? []
            const body = input.body
            const fromId = input.fromId
            const inReplyTo = input.inReplyTo
            const subject = input.subject
            const accountId = input.accountId
            const isNew = input.new
            const draftId = input.draftId
            const threadId = input.threadId

            if (isNew) {
                const newDraft = updateOrCreateDraft(
                    {
                        id: undefined,
                        body,
                        subject,
                        fromId,
                        accountId,
                        to,
                        cc,
                        bcc,
                        replyTo,
                        inReplyTo,
                        grant: acc.grant
                    }
                )
                return newDraft
            } else if (!isNew && !threadId && !draftId) {
                return null
            }

            if (threadId) {

                const thread = await db.thread.update({
                    where: { id: threadId },
                    data: {
                        hasDrafts: true
                    },
                    select: {
                        id: true
                    }
                })

                const draft = await db.draft.findFirst({
                    where: { threadId: thread.id }
                })


                const newDraft = updateOrCreateDraft(
                    {
                        id: draft?.id ? draft.id : undefined,
                        body,
                        subject,
                        fromId,
                        accountId,
                        to,
                        cc,
                        bcc,
                        replyTo,
                        inReplyTo,
                        threadId: thread.id,
                        grant: acc.grant
                    })
                return newDraft
            }


            const draft = await db.draft.findFirst({
                where: { id: draftId }
            })


            const newDraft = updateOrCreateDraft(
                {
                    id: draft?.id,
                    body,
                    subject,
                    fromId,
                    accountId,
                    to,
                    cc,
                    bcc,
                    replyTo,
                    inReplyTo,
                    grant: acc.grant
                }


            )

            return newDraft
        } catch (error) {
            console.log("atempting to save draft", error)
        }
    }),
    getDraft: protectedProcedure.input(z.object({
        accountId: z.string(),
        threadId: z.string().optional(),
        id: z.string().optional()

    })).query(async ({ ctx, input }) => {
        const threadId = input.threadId
        const id = input.id
        const accountId = input.accountId
        if (id) {
            return await ctx.db.draft.findFirst({
                where: {
                    id, accountId
                }
            })
        }
        if (threadId) {
            return await ctx.db.draft.findFirst({
                where: {
                    threadId, accountId
                }
            })
        }

    }),
    deleteDraft: protectedProcedure.input(z.object({
        id: z.string(),
        accountId: z.string(),

    })).mutation(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.session.user.id)
        const id = input.id
        const accountId = account.id
        const grant = account.grant
        const draft = await ctx.db.draft.findUnique({
            where: { id, accountId }
        })

        if (!draft) return {
            success: false,
            message: "draft not found!"
        }

        if (draft?.nylasDraftId) {
            const res = await deleteNylasDraft(grant, draft.nylasDraftId)
            if (!res.success) {
                return {
                    success: false,
                    message: "unable to delete draft"
                }
            }
        }

        const deletedDraft = await ctx.db.draft.delete({
            where: {
                id, accountId
            }
        })


        if (deletedDraft) {
            return {
                success: true,
                message: "draft deleted successfully"
            }
        }
    }),
    sendDraft: protectedProcedure.input(z.object({
        id: z.string(),
        accountId: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.session.user.id)
        const id = input.id
        const accountId = account.id
        const grant = account.grant
        const draft = await ctx.db.draft.findUnique({
            where: { id, accountId }
        })

        if (!draft) return {
            success: false,
            message: "draft not found!"
        }

        if (draft?.nylasDraftId) {
            const res = await sendNylasDraft(grant, draft.nylasDraftId)
            if (!res.success) {
                return {
                    success: false,
                    message: "unable to send mail"
                }
            }
        }

        const deletedDraft = await ctx.db.draft.delete({
            where: {
                id, accountId
            }
        })


        if (deletedDraft) {
            return {
                success: true,
                message: "mail sent successfully"
            }
        }
    }),
    syncDraft: protectedProcedure.input(z.object({
        id: z.string(),
        accountId: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const account = await authoriseAccountAccess(input.accountId, ctx.session.user.id)
        const id = input.id
        const accountId = account.id
        const grant = account.grant
        const draft = await ctx.db.draft.findUnique({
            where: { id, accountId }
        })

        if (!draft) return {
            success: false,
            message: "draft not found!"
        }

        if (draft?.nylasDraftId) {
            const draftValue = await CreateDraftHelper(draft)

            const res = await updateNylasDraft(grant, draft.nylasDraftId, draftValue!)
            if (!res.success) {
                return {
                    success: false,
                    message: "unable to save draft"
                }
            }
        }
        return {
            success: true,
            message: "draft saved successfully"
        }
    }),


})

interface DraftCreate {
    body: string,
    subject: string,
    fromId: string,
    accountId: string,
    to?: { name: string; email: string }[] | [],
    cc?: { name: string; email: string }[] | [],
    bcc?: { name: string; email: string }[] | [],
    replyTo?: { name: string; email: string }[] | [],
    id?: string,
    threadId?: string,
    inReplyTo?: string,
    grant: string
}

async function updateOrCreateDraft(
    { body, subject, fromId, accountId, to, cc, bcc, replyTo, id, threadId, inReplyTo, grant }: DraftCreate
) {
    if (id) {

        const updatedDraft = await db.draft.update({
            where: {
                id: id
            },
            data: {
                body: body ?? "",
                subject: subject ?? "",
                fromId,
                to: to ?? [],
                cc: cc ?? [],
                bcc: bcc ?? [],
                replyTo: replyTo ?? [],
                inReplyTo: inReplyTo,
            }
        })

        return updatedDraft
    }

    const newDraft = await db.draft.create({
        data: {
            body: body ?? "",
            subject: subject ?? "",
            fromId,
            to: to ?? [],
            cc: cc ?? [],
            bcc: bcc ?? [],
            replyTo: replyTo ?? [],
            inReplyTo: inReplyTo,
            accountId,
            threadId,
            sources: "internal",
            syncUpdate: "pending",
            starred: false,
        }
    })
    // @ts-ignore
    createNewNylasDraft(newDraft, grant, newDraft.id)
    return newDraft
}

async function CreateDraftHelper(newDraft: Draft) {

    try {

        const from = await db.emailAddress.findFirst({
            where: { id: newDraft.fromId },
            select: {
                name: true, email: true
            }
        })
        let to: { name: string; email: string; }[] = []
        let cc: { name: string; email: string; }[] = []
        let bcc: { name: string; email: string; }[] = []
        let replyTo: { name: string; email: string; }[] = []

        if (Array.isArray(newDraft.to) && newDraft.to) {
            to = newDraft.to?.map(
                // @ts-ignore
                (email: { name: string, email: string }) => ({
                    name: email.name,
                    email: email.email,
                }),
            );
        }
        if (Array.isArray(newDraft.cc) && newDraft.cc) {
            cc = newDraft.cc?.map(
                // @ts-ignore
                (email: { name: string, email: string }) => ({
                    name: email.name,
                    email: email.email,
                }),
            );
        }
        if (Array.isArray(newDraft.bcc) && newDraft.bcc) {
            bcc = newDraft.bcc?.map(
                // @ts-ignore
                (email: { name: string, email: string }) => ({
                    name: email.name,
                    email: email.email,
                }),
            );
        }
        if (Array.isArray(newDraft.replyTo) && newDraft.replyTo) {
            replyTo = newDraft.replyTo?.map(
                // @ts-ignore
                (email: { name: string, email: string }) => ({
                    name: email.name,
                    email: email.email,
                }),
            );
        }
        const draft = {
            body: newDraft.body ?? "",
            subject: newDraft.subject ?? "",
            syncUpdate: newDraft.syncUpdate,
            starred: newDraft.starred,
            from: [{ name: from?.name!, email: from?.email! }],
            to: to,
            cc: cc,
            bcc: bcc,
            replyTo: replyTo,
            threadId: newDraft.threadId ?? undefined,
            reply_to_message_id: newDraft.inReplyTo ?? undefined
        }
        return draft
    } catch (error) {
        console.log("try syncing draft", error)
    }

}

const createNewNylasDraft = async (grant: string, draft: Draft, id: string) => {
    try {
        const newDraft = await CreateDraftHelper(draft)
        await createDraft(grant, newDraft!, id)
    } catch (error) {
        console.log("error creating a new draft at nylas")
    }


}
