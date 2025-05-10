import { syncDraftsToDatabase, syncSentMailToDatabase, syncThreadsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { type NextRequest, NextResponse } from "next/server";

import { fetchDrafts, fetchSentMail, getAllThreads, getinfo, } from "@/lib/nylas";
import { getBulkEmbeddings, getEmbeddings } from "@/lib/embeddings";
import { embedPendingEmails } from "@/lib/embed";

//  npm install @vercel/functions

export const maxDuration = 300

export const GET = async () => {

    // const body = await req.json()
    // const { email, userId, grant } = body
    const session = await auth();
    const email = session?.user.email as string


    // if (!userId) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });

    const dbUserAccount = await db.userAccount.findUnique({
        where: {
            emailAddress: email,
        }
    })
    if (!dbUserAccount) return NextResponse.json({ error: "ACCOUNT_NOT_FOUND" }, { status: 404 });
    const grant = dbUserAccount.grant

    // const [threads, drafts, sentMails] = await Promise.all([getAllThreads(grant), fetchDrafts(grant), fetchSentMail(grant)])

    // const sentMails = await fetchSentMail(grant)
    // console.log(`threads fetched completed fetched ${threads?.length} threads ${drafts?.length}draft ${sentMails?.length} `)

    // await Promise.all([syncThreadsToDatabase(threads, dbUserAccount.id), syncDraftsToDatabase(drafts, dbUserAccount.id), syncSentMailToDatabase(sentMails, dbUserAccount.id)
    // ])
    // await syncThreadsToDatabase(threads, dbUserAccount.id)
    await embedPendingEmails(25, dbUserAccount.id)
    console.log("complete threads and drafts")


    // return NextResponse.json({ success: true, drafts: drafts?.length, sentMails: sentMails?.length, threads: threads?.length }, { status: 200 });
    return NextResponse.json({ success: true, }, { status: 200 });

}


