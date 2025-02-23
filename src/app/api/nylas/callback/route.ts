import { getAccountDetails, getAurinkoToken } from "@/lib/aurinko";
import { waitUntil } from '@vercel/functions'
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import axios from "axios";
import { type NextRequest, NextResponse } from "next/server";
import { getNylasToken } from "@/lib/nylas";

export const GET = async (req: NextRequest) => {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const userId = session.user.id
    const params = req.nextUrl.searchParams
    console.log("params")
    console.log(params)
    const code = params.get('code');
    // if (!code) return NextResponse.json({ error: "Account connection failed" }, { status: 400 });

    const accountDetails = await getNylasToken(code as string)
    if (!accountDetails) return NextResponse.json({ error: "Failed to fetch token" }, { status: 400 });
    await db.userAccount.upsert({
        where: {
            emailAddress: accountDetails.email as string,
        },
        create: {
            id: userId,
            userId,
            access_token: accountDetails.access_Token as string,
            provider: accountDetails.provider as string,
            emailAddress: accountDetails.email as string,
            grant: accountDetails.grant as string
        },
        update: {
            access_token: accountDetails.access_Token as string,
            grant: accountDetails.grant as string
        }
    })
    waitUntil(
        axios.post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, { email: accountDetails.email, userId, grant: accountDetails.grant }).then((res) => {
            console.log(res.data)
        }).catch((err) => {
            console.log(err.response.data)
        })
    )
    return NextResponse.redirect(new URL('/', req.url))
}