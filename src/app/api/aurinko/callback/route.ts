import { getAccountDetails, getAurinkoToken } from "@/lib/aurinko";
import { waitUntil } from '@vercel/functions'
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import axios from "axios";
import { type NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
    const session = await auth()
    if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    const userId = session.user.id
    const params = req.nextUrl.searchParams
    const status = params.get('status');
    if (status !== 'success') return NextResponse.json({ error: "Account connection failed" }, { status: 400 });

    const code = params.get('code');
    const token = await getAurinkoToken(code as string)
    if (!token) return NextResponse.json({ error: "Failed to fetch token" }, { status: 400 });
    const accountDetails = await getAccountDetails(token.accessToken)
    await db.userAccount.upsert({
        where: { id: token.accountId.toString() },
        create: {
            id: token.accountId.toString(),
            userId,
            access_token: token.accessToken,
            provider: 'Aurinko',
            emailAddress: accountDetails.email,
            name: accountDetails.name
        },
        update: {
            access_token: token.accessToken,
        }
    })
    waitUntil(
        axios.post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, { accountId: token.accountId.toString(), userId }).then((res) => {
            console.log(res.data)
        }).catch((err) => {
            console.log(err.response.data)
        })
    )

    return NextResponse.redirect(new URL('/mail', req.url))
}