import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { waitUntil } from '@vercel/functions'
import axios from "axios";

import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    console.log("session.user \n")
    const account = await db.account.findFirst({
        where: {
            userId: session.user.id
        },
        select: {
            access_token: true
        }
    })
    const access_token = account?.access_token
    console.log(req.nextUrl)
    console.log("use111", access_token)

    const userId = session?.user.id as string
    await db.userAccount.upsert({
        where: { id: userId },
        create: {
            id: userId,
            userId,
            access_token: access_token as string,
            provider: "google",
            emailAddress: session?.user.email as string,
            name: session?.user.name as string
        },
        update: {
            access_token: access_token as string,
        }
    })

    waitUntil(
        axios.post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, { userId }).then((res) => {
            console.log(res.data)
        }).catch((err) => {
            console.log(err.response.data)
        })
    )

    return NextResponse.redirect(new URL('/mail', req.url))

}


