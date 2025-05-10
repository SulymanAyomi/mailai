import { db } from '@/server/db';
import pLimit from 'p-limit';
import { Prisma } from '@prisma/client';
import { Thread, EmailName, Attachment, Draft, Message } from 'nylas';
import { getEmail } from './nylas';
import { turndown } from './turndown';
import { getBulkEmbeddings, getEmbeddings } from './embeddings';
import { OramaManager } from './orama';


export async function syncEmailsToDatabase(emails: string[], accountId: string, grantId: string) {
    console.log(`attempting to sync emails to database`, emails.length);
    const limit = pLimit(5)

    try {
        //new plan: use the threadId to fetch all related email by threadid, filter by existing and sync to db
        for (const [index, email] of emails.entries()) {

            await upsertEmail(email, accountId, index, grantId);
        }

    } catch (error) {
        console.log(error);
    }
}

export async function syncDraftsToDatabase(drafts: Draft[] | undefined, accountId: string) {
    if (!drafts) return
    console.log(`attempting to sync drafts to database`, drafts.length);
    const limit = pLimit(1)

    try {
        for (const [index, draft] of drafts.entries()) {

            await upsertDraft(draft, accountId, index);
        }

    } catch (error) {
        console.log(error);
    }
}

export async function syncSentMailToDatabase(messages: Message[] | undefined, accountId: string) {
    if (!messages) return
    console.log(`attempting to sync sent mails to database`, messages.length);
    const limit = pLimit(5)

    const nylasIds = messages.map((msg) => msg.id)
    const existings = await db.email.findMany({
        where: {
            id: { in: nylasIds },
            userAccountId: accountId,
        }
    })

    const existingIds = new Set(existings.map((e) => e.id))

    const newMessages = messages.filter((msg) => !existingIds.has(msg.id))

    if (newMessages.length > 0) {

        try {
            await upsertMails(newMessages, accountId);

        } catch (error) {
            console.log(error);
        }

    }



}

export async function syncThreadsToDatabase(threads: Thread[] | undefined, accountId: string) {
    if (!threads) return
    console.log(`attempting to sync threads to database`, threads.length);
    const limit = pLimit(1)

    try {
        threads.map((thread, index) => {
            limit(async () => (
                await upsertThread(thread, accountId, index)
            ))
        })
    } catch (error) {
        console.log(error);
    }
}

async function upsertDraft(draft: Draft | undefined, accountId: string, index: number) {

    if (!draft) return
    const f = draft.from![0]
    const from = await db.emailAddress.findFirst({
        where: { email: f?.email },
        select: {
            id: true
        }
    })
    const To: any[] = draft.to.map((a) => a)
    const Cc: any[] = draft.cc ? draft.cc?.map((a) => a) : []
    const Bcc: any[] = draft.bcc ? draft.bcc?.map((a) => a) : []
    const replyTo: any[] = draft.replyTo ? draft.replyTo?.map((a) => a) : []
    const existingDraft = await db.draft.findUnique({
        where: { nylasDraftId: draft.id }
    })

    if (existingDraft) {

        // Conflict check
        const remoteUpdated = new Date(draft.date * 1000);

        if (existingDraft.updatedAt > remoteUpdated) {
            return;
        }

        await db.draft.update({
            where: { nylasDraftId: draft.id },
            data: {
                body: draft.body,
                subject: draft.subject,
                syncUpdate: "synced",
                starred: draft.starred,
                to: To,
                cc: Cc,
                bcc: Bcc,
                replyTo: replyTo,
                threadId: draft.threadId,
                updatedAtRemote: new Date(draft.date * 1000),
            }
        })

    }

    await db.draft.create({
        data: {
            accountId,
            nylasDraftId: draft.id,
            body: draft.body,
            subject: draft.subject,
            sources: "external",
            syncUpdate: "synced",
            starred: draft.starred ?? false,
            fromId: from?.id!,
            to: To,
            cc: Cc,
            bcc: Bcc,
            replyTo: replyTo,
            threadId: draft.threadId,
            updatedAtRemote: new Date(draft.date * 1000),
        }
    })

    console.log("draft synced", index)

}


async function upsertThread(thread: Thread, accountId: string, index: number) {


    try {

        let emailLabelType: 'inbox' | 'sent' | 'draft' = 'inbox'
        if (thread.folders.includes('INBOX') || thread.folders.includes('important')) {
            emailLabelType = 'inbox'
        } else if (thread.folders.includes('SENT')) {
            emailLabelType = 'sent'
        } else if (thread.folders.includes('DRAFTS')) {
            emailLabelType = 'draft'
        }
        console.log("upserting to sync thread to database", index)
        const addressesToUpsert = new Map()
        for (const address of thread.participants) {
            addressesToUpsert.set(address.email, address);
        }

        // const upsertedAddresses: EmailName[] | null = [];
        const upsertedAddresses: (Awaited<ReturnType<typeof upsertEmailAddress>> | null)[] = [];


        for (const address of addressesToUpsert.values()) {
            const upsertedAddress = await upsertEmailAddress(address, accountId);
            upsertedAddresses.push(upsertedAddress);
        }

        const allParticipant = upsertedAddresses.map((address => address?.id as string))

        const lastMessageDate = new Date((thread.latestMessageReceivedDate ?? thread.latestMessageSentDate as number) * 1000)
        console.log(lastMessageDate, "Dateee")
        // 2. Upsert Thread
        await db.thread.upsert({
            where: {
                id: thread.id, userAccountId: accountId,
            },
            update: {
                subject: thread.subject ?? "",
                userAccountId: accountId,
                lastMessageDate,
                done: thread.unread,
                hasAttachments: thread.hasAttachments,
                hasDrafts: thread.hasDrafts,
                draft_ids: thread.draftIds ?? [],
                snippet: thread.snippet ?? "",
                folders: thread.folders,
                participantIds: [...new Set([
                    ...allParticipant
                ])],
                draftStatus: emailLabelType === 'draft',
                inboxStatus: emailLabelType === 'inbox',
                sentStatus: emailLabelType === 'sent',

            },
            create: {
                id: thread.id,
                subject: thread.subject ?? "",
                lastMessageDate,
                userAccountId: accountId,
                hasAttachments: thread.hasAttachments,
                hasDrafts: thread.hasDrafts,
                draft_ids: thread.draftIds,
                snippet: thread.snippet ?? "",
                done: thread.unread,
                folders: thread.folders,
                draftStatus: emailLabelType === 'draft',
                inboxStatus: emailLabelType === 'inbox',
                sentStatus: emailLabelType === 'sent',
                participantIds: [...new Set([
                    ...allParticipant
                ])]
            }
        });

        if (thread.latestDraftOrMessage.folders.includes("DRAFTS")) {
            await upsertDraft(thread.latestDraftOrMessage as Draft, accountId, 0)
        } else {

            await upsertMail(thread.latestDraftOrMessage as Message, accountId, 0)
        }



        if (thread.messageIds.length > 1) {
            await syncEmailsToDatabase(thread.messageIds, accountId, thread.grantId)
        }
        console.log("thread synced", thread.id)
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.log(`Prisma error for email ${thread.id}: ${error.message}`);
        } else {
            console.log(`Unknown error for email ${thread.id}}: ${error}`);
        }
    }
}


async function upsertEmail(emailId: string, accountId: string, index: number, grantId: string) {
    try {
        const upsertEmail = await db.email.findFirst({
            where: { id: emailId }
        })

        if (upsertEmail) return;

        const newEmail = await getEmail(grantId, emailId)
        const oramaClient = new OramaManager(accountId)
        oramaClient.initialize()

        const addressesToUpsert = new Map()
        const allEmailAddress: EmailName[] = []
        newEmail.from?.map(address => allEmailAddress.push(address))
        newEmail.to?.map(address => allEmailAddress.push(address))
        newEmail.cc?.map(address => allEmailAddress.push(address))
        newEmail.bcc?.map(address => allEmailAddress.push(address))
        newEmail.replyTo?.map(address => allEmailAddress.push(address))
        // @ignore type
        for (const address of allEmailAddress) {
            addressesToUpsert.set(address.email, address);
        }

        const upsertedAddresses: (Awaited<ReturnType<typeof upsertEmailAddress>> | null)[] = [];


        for (const address of addressesToUpsert.values()) {
            const upsertedAddress = await upsertEmailAddress(address, accountId);
            upsertedAddresses.push(upsertedAddress);
        }

        const addressMap = new Map(
            upsertedAddresses.filter(Boolean).map(address => [address!.email, address])
        );

        let fromEmail = ""
        newEmail.from?.map(email => {
            fromEmail = email.email
        })

        let fromAddress = await db.emailAddress.findFirst({
            where: { email: fromEmail },
            select: { id: true, name: true, email: true }
        })
        if (!fromAddress) {
            console.log(`Failed to upsert from address for email ${newEmail.snippet}`);
            return;
        }

        const toAddresses = newEmail.to.map(addr => addressMap.get(addr.email)).filter(Boolean);
        const ccAddresses = newEmail.cc?.map(addr => addressMap.get(addr.email)).filter(Boolean);
        const bccAddresses = newEmail.bcc?.map(addr => addressMap.get(addr.email)).filter(Boolean);
        const replyToAddresses = newEmail.replyTo?.map(addr => addressMap.get(addr.email)).filter(Boolean);



        let emailLabelType: 'inbox' | 'sent' | 'draft' = 'inbox'
        if (newEmail.folders.includes('inbox') || newEmail.folders.includes('important')) {
            emailLabelType = 'inbox'
        } else if (newEmail.folders.includes('sent')) {
            emailLabelType = 'sent'
        } else if (newEmail.folders.includes('draft')) {
            emailLabelType = 'draft'
        }

        const attachments = newEmail.attachments ? true : false

        // 3. Upsert Email
        const syncMail = async () => {
            await db.email.upsert({
                where: { id: newEmail.id },
                update: {
                    id: newEmail.id,
                    threadId: newEmail.threadId,
                    folders: newEmail.folders,
                    createdTime: new Date(newEmail.date * 1000),
                    lastModifiedTime: new Date(newEmail.date * 1000),
                    subject: newEmail.subject ?? "",
                    bodySnippet: newEmail.snippet,
                    unRead: newEmail.unread,
                    fromId: fromAddress.id,
                    body: newEmail.body,
                    to: { connect: toAddresses.map(a => ({ id: a!.id })) },
                    cc: { connect: ccAddresses?.map(a => ({ id: a!.id })) },
                    bcc: { connect: bccAddresses?.map(a => ({ id: a!.id })) },
                    hasAttachments: attachments as boolean,
                    replyTo: { connect: replyToAddresses?.map(a => ({ id: a!.id })) }
                },
                create: {
                    id: newEmail.id,
                    threadId: newEmail.threadId as string,
                    folders: newEmail.folders,
                    createdTime: new Date(newEmail.date * 1000),
                    lastModifiedTime: new Date(),
                    subject: newEmail.subject ?? "",
                    bodySnippet: newEmail.snippet,
                    unRead: newEmail.unread as boolean,
                    fromId: fromAddress.id,
                    body: newEmail.body,
                    to: { connect: toAddresses.map(a => ({ id: a!.id })) },
                    cc: { connect: ccAddresses?.map(a => ({ id: a!.id })) },
                    bcc: { connect: bccAddresses?.map(a => ({ id: a!.id })) },
                    hasAttachments: attachments as boolean,
                    userAccountId: accountId
                }
            });
        }
        // 4. sync to orama
        const syncToOrama = async () => {
            const body = turndown.turndown(newEmail.body ?? newEmail.snippet ?? '')
            const payload = `From: ${fromAddress.name} <${fromAddress.email}>\nTo: ${toAddresses.map(t => `${t?.name} <${t?.email}>`).join(', ')}\nSubject: ${newEmail.subject}\nBody: ${body}\n SentAt: ${new Date(newEmail.date).toLocaleString()}`
            const bodyEmbedding = await getEmbeddings(payload);
            await oramaClient.insert({
                title: newEmail.subject,
                body: body,
                rawBody: newEmail.snippet ?? '',
                from: `${fromAddress.name} <${fromAddress.email}>`,
                to: toAddresses.map(t => `${t?.name} <${t?.email}>`),
                sentAt: new Date(newEmail.date).toLocaleString(),
                threadId: newEmail.threadId,
                embeddings: bodyEmbedding
            })
        }

        // 5. Upsert Attachments

        const syncAttach = async () => {
            if (newEmail.attachments) {
                for (const attachment of newEmail?.attachments) {
                    await upsertAttachment(newEmail.id, attachment);
                }
            }
        }



        await Promise.all([syncToOrama(), syncMail(), syncAttach()])

        await oramaClient.saveIndex()

        console.log("email synced", newEmail.id)


    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.log(`Prisma error for email ${emailId}: ${error.message}`);
        } else {
            console.log(`Unknown error for email ${emailId}}: ${error}`);
        }
    }
}

async function upsertMail(message: Message | undefined, accountId: string) {
    if (!message) return
    const upsertEmail = await db.email.findFirst({
        where: { id: message.id }
    })

    if (upsertEmail) return;
    console.log("upserting a mail to sync mail to database")

    const oramaClient = new OramaManager(accountId)
    oramaClient.initialize()
    const newEmail = message

    try {

        const addressesToUpsert = new Map()
        const allEmailAddress: EmailName[] = []
        newEmail.from?.map(address => allEmailAddress.push(address))
        newEmail.to?.map(address => allEmailAddress.push(address))
        newEmail.cc?.map(address => allEmailAddress.push(address))
        newEmail.bcc?.map(address => allEmailAddress.push(address))
        newEmail.replyTo?.map(address => allEmailAddress.push(address))
        // @ignore type
        for (const address of allEmailAddress) {
            addressesToUpsert.set(address.email, address);
        }

        const upsertedAddresses: (Awaited<ReturnType<typeof upsertEmailAddress>> | null)[] = [];


        for (const address of addressesToUpsert.values()) {
            const upsertedAddress = await upsertEmailAddress(address, accountId);
            upsertedAddresses.push(upsertedAddress);
        }

        const addressMap = new Map(
            upsertedAddresses.filter(Boolean).map(address => [address!.email, address])
        );

        let fromEmail = ""
        newEmail.from?.map(email => {
            fromEmail = email.email
        })

        let fromAddress = await db.emailAddress.findFirst({
            where: { email: fromEmail },
            select: { id: true, name: true, email: true }
        })
        if (!fromAddress) {
            console.log(`Failed to upsert from address for email ${newEmail.snippet}`);
            return;
        }

        const toAddresses = newEmail.to.map(addr => addressMap.get(addr.email)).filter(Boolean);
        const ccAddresses = newEmail.cc?.map(addr => addressMap.get(addr.email)).filter(Boolean);
        const bccAddresses = newEmail.bcc?.map(addr => addressMap.get(addr.email)).filter(Boolean);
        const replyToAddresses = newEmail.replyTo?.map(addr => addressMap.get(addr.email)).filter(Boolean);

        const attachments = newEmail.attachments ? true : false

        //3.  save Email
        const syncMail = async () => {
            await db.email.create({
                data: {
                    id: newEmail.id,
                    threadId: newEmail.threadId as string,
                    folders: newEmail.folders,
                    createdTime: new Date(newEmail.date * 1000),
                    lastModifiedTime: new Date(),
                    subject: newEmail.subject ?? "",
                    bodySnippet: newEmail.snippet,
                    unRead: newEmail.unread as boolean,
                    fromId: fromAddress.id,
                    body: newEmail.body,
                    to: { connect: toAddresses.map(a => ({ id: a!.id })) },
                    cc: { connect: ccAddresses?.map(a => ({ id: a!.id })) },
                    bcc: { connect: bccAddresses?.map(a => ({ id: a!.id })) },
                    hasAttachments: attachments as boolean,
                    userAccountId: accountId,

                }
            });
        }
        // 4. sync to orama
        const syncToOrama = async () => {
            const body = turndown.turndown(newEmail.body ?? newEmail.snippet ?? '')
            const payload = `From: ${fromAddress.name} <${fromAddress.email}>\nTo: ${toAddresses.map(t => `${t?.name} <${t?.email}>`).join(', ')}\nSubject: ${newEmail.subject}\nBody: ${body}\n SentAt: ${new Date(newEmail.date).toLocaleString()}`
            const bodyEmbedding = await getEmbeddings(payload);
            await oramaClient.insert({
                title: newEmail.subject,
                body: body,
                rawBody: newEmail.snippet ?? '',
                from: `${fromAddress.name} <${fromAddress.email}>`,
                to: toAddresses.map(t => `${t?.name} <${t?.email}>`),
                sentAt: new Date(newEmail.date).toLocaleString(),
                threadId: newEmail.threadId,
                embeddings: bodyEmbedding
            })
        }

        // 5. Upsert Attachments

        const syncAttach = async () => {
            if (newEmail.attachments) {
                for (const attachment of newEmail?.attachments) {
                    await upsertAttachment(newEmail.id, attachment);
                }
            }
        }

        await Promise.all([syncToOrama(), syncMail(), syncAttach()])

        await oramaClient.saveIndex()

        console.log("email synced", newEmail.id)


    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.log(`Prisma error for sent email ${messages.length}: ${error.message}`);
        } else {
            console.log(`Unknown error for sent email ${messages.length}}: ${error}`);
        }
    }
}

async function upsertMails(messages: Message[] | undefined, accountId: string) {
    if (!messages) return
    console.log("upserting mail to sync emails to database ", messages.length)

    const oramaClient = new OramaManager(accountId)
    oramaClient.initialize()

    try {
        for (const newEmail of messages) {

            const addressesToUpsert = new Map()
            const allEmailAddress: EmailName[] = []
            newEmail.from?.map(address => allEmailAddress.push(address))
            newEmail.to?.map(address => allEmailAddress.push(address))
            newEmail.cc?.map(address => allEmailAddress.push(address))
            newEmail.bcc?.map(address => allEmailAddress.push(address))
            newEmail.replyTo?.map(address => allEmailAddress.push(address))
            // @ignore type
            for (const address of allEmailAddress) {
                addressesToUpsert.set(address.email, address);
            }

            const upsertedAddresses: (Awaited<ReturnType<typeof upsertEmailAddress>> | null)[] = [];


            for (const address of addressesToUpsert.values()) {
                const upsertedAddress = await upsertEmailAddress(address, accountId);
                upsertedAddresses.push(upsertedAddress);
            }

            const addressMap = new Map(
                upsertedAddresses.filter(Boolean).map(address => [address!.email, address])
            );

            let fromEmail = ""
            newEmail.from?.map(email => {
                fromEmail = email.email
            })

            let fromAddress = await db.emailAddress.findFirst({
                where: { email: fromEmail },
                select: { id: true, name: true, email: true }
            })
            if (!fromAddress) {
                console.log(`Failed to upsert from address for email ${newEmail.snippet}`);
                return;
            }

            const toAddresses = newEmail.to.map(addr => addressMap.get(addr.email)).filter(Boolean);
            const ccAddresses = newEmail.cc?.map(addr => addressMap.get(addr.email)).filter(Boolean);
            const bccAddresses = newEmail.bcc?.map(addr => addressMap.get(addr.email)).filter(Boolean);
            const replyToAddresses = newEmail.replyTo?.map(addr => addressMap.get(addr.email)).filter(Boolean);

            const attachments = newEmail.attachments ? true : false

            //3.  save Email
            const syncMail = async () => {
                await db.email.create({
                    data: {
                        id: newEmail.id,
                        threadId: newEmail.threadId as string,
                        folders: newEmail.folders,
                        createdTime: new Date(newEmail.date * 1000),
                        lastModifiedTime: new Date(),
                        subject: newEmail.subject ?? "",
                        bodySnippet: newEmail.snippet,
                        unRead: newEmail.unread as boolean,
                        fromId: fromAddress.id,
                        body: newEmail.body,
                        to: { connect: toAddresses.map(a => ({ id: a!.id })) },
                        cc: { connect: ccAddresses?.map(a => ({ id: a!.id })) },
                        bcc: { connect: bccAddresses?.map(a => ({ id: a!.id })) },
                        hasAttachments: attachments as boolean,
                        userAccountId: accountId,

                    }
                });
            }
            // 4. sync to orama
            const syncToOrama = async () => {
                const body = turndown.turndown(newEmail.body ?? newEmail.snippet ?? '')
                const payload = `From: ${fromAddress.name} <${fromAddress.email}>\nTo: ${toAddresses.map(t => `${t?.name} <${t?.email}>`).join(', ')}\nSubject: ${newEmail.subject}\nBody: ${body}\n SentAt: ${new Date(newEmail.date).toLocaleString()}`
                const bodyEmbedding = await getEmbeddings(payload);
                await oramaClient.insert({
                    title: newEmail.subject,
                    body: body,
                    rawBody: newEmail.snippet ?? '',
                    from: `${fromAddress.name} <${fromAddress.email}>`,
                    to: toAddresses.map(t => `${t?.name} <${t?.email}>`),
                    sentAt: new Date(newEmail.date).toLocaleString(),
                    threadId: newEmail.threadId,
                    embeddings: bodyEmbedding
                })
            }

            // 5. Upsert Attachments

            const syncAttach = async () => {
                if (newEmail.attachments) {
                    for (const attachment of newEmail?.attachments) {
                        await upsertAttachment(newEmail.id, attachment);
                    }
                }
            }

            await Promise.all([syncToOrama(), syncMail(), syncAttach()])

            await oramaClient.saveIndex()

            console.log("email synced", newEmail.id)

        }
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            console.log(`Prisma error for sent email ${messages.length}: ${error.message}`);
        } else {
            console.log(`Unknown error for sent email ${messages.length}}: ${error}`);
        }
    }
}


async function upsertEmailAddress(address: EmailName, accountId: string) {
    try {
        const existingAddress = await db.emailAddress.findUnique({
            where: { userAccountId_email: { userAccountId: accountId, email: address.email ?? "" } },
        })
        if (existingAddress) {
            return await db.emailAddress.update({
                where: { id: existingAddress.id },
                data: { name: address.name }
            })
        } else {
            return await db.emailAddress.create({
                data: { email: address.email ?? "", name: address.name, userAccountId: accountId }
            })
        }

    } catch (error) {
        console.log("Failed to upsert email address", error)
        return null
    }
}

async function upsertAttachment(emailId: string, attachment: Attachment) {
    try {
        await db.emailAttachment.upsert({
            where: { id: attachment.id ?? "" },
            update: {
                name: attachment.filename,
                contentType: attachment.contentType,
                contentId: attachment.contentId,
                contentDisposition: attachment.contentDisposition,
                isInLine: attachment.isInline,
                size: attachment.size as number
            },
            create: {
                id: attachment.id,
                emailId,
                name: attachment.filename,
                contentType: attachment.contentType,
                contentId: attachment.contentId ?? "",
                contentDisposition: attachment.contentDisposition,
                isInLine: attachment.isInline as boolean,
                size: attachment.size as number
            },
        });
    } catch (error) {
        console.log(`Failed to upsert attachment for email ${emailId}: ${error}`);
    }
}

function parseEmailAddress(address: string) {
    let emailAddress = {
        address: "",
        raw: "",
        name: ""
    }
    emailAddress.address = address
    const sub = address.split("\u003C")
    if (sub.length > 1) {
        const f = sub[1]?.replace("\u003E", "")
        emailAddress.name = sub[0] as string
        emailAddress.address = f as string
    } else {
        emailAddress.address = address
    }

    return emailAddress
}