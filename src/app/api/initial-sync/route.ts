import { syncDraftsToDatabase, syncSentMailToDatabase, syncThreadsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { type NextRequest, NextResponse } from "next/server";

import { fetchDrafts, fetchSentMail, getAllThreads, getinfo, } from "@/lib/nylas";

//  npm install @vercel/functions

export const maxDuration = 300

export const POST = async (req: NextRequest) => {

    const body = await req.json()
    const { email, userId, grant } = body
    // const email = session.user.email as string

    if (!userId) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });

    const dbUserAccount = await db.userAccount.findUnique({
        where: {
            emailAddress: email,
        }
    })
    if (!dbUserAccount) return NextResponse.json({ error: "ACCOUNT_NOT_FOUND" }, { status: 404 });


    console.log(" start threads")


    const [threads, drafts, sentMails] = await Promise.all([getAllThreads(grant), fetchDrafts(grant), fetchSentMail(grant)])

    console.log("threads fetched completed")

    await Promise.all([syncThreadsToDatabase(threads, dbUserAccount.id), syncDraftsToDatabase(drafts, dbUserAccount.id), syncSentMailToDatabase(sentMails, dbUserAccount.id)
    ])
    console.log("complete threads and drafts")


    return NextResponse.json({ success: true, threads, drafts, sentMails }, { status: 200 });

}


