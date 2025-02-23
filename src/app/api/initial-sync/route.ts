import { Account } from "@/lib/account";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { type NextRequest, NextResponse } from "next/server";
import { GmailAccount } from "@/lib/gmail";
import { data } from "@/lib/gmailData";

//  npm install @vercel/functions

export const maxDuration = 300

export const POST = async (req: NextRequest) => {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const body = await req.json()
    const { email, userId, grant } = body

    if (!userId) return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });

    const dbUserAccount = await db.userAccount.findUnique({
        where: {
            emailAddress: email,
        }
    })
    if (!dbUserAccount) return NextResponse.json({ error: "ACCOUNT_NOT_FOUND" }, { status: 404 });

    // const Useraccount = new GmailAccount(dbUserAccount.access_token)
    // await Useraccount.createSubscription()
    // const response = await Useraccount.startSync()
    // if (!response) return NextResponse.json({ error: "FAILED_TO_SYNC" }, { status: 500 });
    // if (response == "No messages") return NextResponse.json({ error: "NO MESSAGES" }, { status: 200 });
    // const {  emails } = response

    await syncEmailsToDatabase(emails, dbUserAccount.id)

    // await db.userAccount.update({
    //     where: {
    //         token: dbUserAccount.token,
    //     },
    //     data: {
    //         nextDeltaToken: deltaToken,
    //     },
    // });
    // console.log('sync complete', deltaToken)
    return NextResponse.json({ success: true, email: emails }, { status: 200 });

}