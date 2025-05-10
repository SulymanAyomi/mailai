// src/server/routers/upload.ts
import { v2 as cloudinary } from 'cloudinary'
import { CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME } from '@/config'
import { auth } from '@/server/auth'
import { NextResponse } from 'next/server'

// configure once at app startup
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRE!,
})



export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
        const userId = session.user.id
        if (!userId) {
            return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
        }


        const { folder } = await req.json();

        // timestamp is seconds since epoch
        const timestamp = Math.floor(Date.now() / 1000)
        // any eager transformations / foldering can go here
        const paramsToSign = {
            timestamp,
            folder: folder,
        }
        const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!)
        return {
            cloudName: CLOUDINARY_CLOUD_NAME!,
            apiKey: CLOUDINARY_API_KEY!,
            timestamp,
            signature,
            folder: folder,
        }

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "error" }, { status: 500 });
    }
}
