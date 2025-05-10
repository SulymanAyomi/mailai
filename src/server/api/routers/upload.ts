// src/server/routers/upload.ts
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { z } from 'zod'
import { v2 as cloudinary } from 'cloudinary'
import { CLOUDINARY_API_KEY, CLOUDINARY_CLOUD_NAME } from '@/config'

// configure once at app startup
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRE!,
})

export const uploadRouter = createTRPCRouter({
    cloudinarySign: protectedProcedure.input(z.object({
        accountId: z.string(),
        folder: z.string(),
    })).query(async ({ input, ctx }) => {
        const account = await ctx.db.userAccount.findFirst({
            where: {
                id: input.accountId,
                userId: ctx.session.user.id
            },
            select: {
                id: true
            }
        })

        if (!account) throw new Error("Invalid token")
        // timestamp is seconds since epoch
        const timestamp = Math.floor(Date.now() / 1000)
        // any eager transformations / foldering can go here
        const paramsToSign = {
            timestamp,
            folder: input.folder,
        }
        const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!)
        return {
            cloudName: CLOUDINARY_CLOUD_NAME!,
            apiKey: CLOUDINARY_API_KEY!,
            timestamp,
            signature,
            folder: input.folder,
        }

    }),
})

