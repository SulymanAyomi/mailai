// src/lib/upload.ts

import { api } from "@/trpc/react"
import axios from "axios"

/**
 * Uploads a File to Cloudinary and returns its Base64-encoded data.
 * @param file The File to upload.
 * @param folder Optional target folder in your Cloudinary account.
 * @returns A promise that resolves to the Base64 string of the uploaded file.
 */
export async function uploadToCloudinary(
    file: File,
    folder: string = 'email_attachments',
    accountId: string
): Promise<{ base64: string, fileUrl: string } | null> {

    try {
        // 1. Get upload signature & params from your backend
        // const res = await axios.post("/api/upload", {
        //     folder
        // })

        // if (!res.data) return null
        // const data = res.data
        // // 2. Build the multipart form data
        // const form = new FormData()
        // form.append('file', file)
        // form.append('api_key', data?.apiKey!)
        // form.append('timestamp', String(data?.timestamp))
        // form.append('signature', data?.signature!)
        // form.append('folder', folder)

        // // 3. Upload to Cloudinary’s unsigned endpoint
        // const uploadRes = await fetch(
        //     `https://api.cloudinary.com/v1_1/${data?.cloudName}/upload`,
        //     {
        //         method: 'POST',
        //         body: form,
        //     }
        // )
        // if (!uploadRes.ok) {
        //     throw new Error(`Cloudinary upload failed: ${uploadRes.statusText}`)
        // }
        // const uploadJson = await uploadRes.json()
        // const fileUrl: string = uploadJson.secure_url

        // // 4. Fetch the uploaded file as an ArrayBuffer
        // const fileRes = await fetch(fileUrl)
        // if (!fileRes.ok) {
        //     throw new Error(`Failed to fetch uploaded file: ${fileRes.statusText}`)
        // }
        // const buffer = await fileRes.arrayBuffer()

        // // 5. Convert to Base64 string
        // const base64 = btoa(
        //     String.fromCharCode(...new Uint8Array(buffer))
        // )

        return { base64: "yellow", fileUrl: "white" }
    } catch (error) {
        return null
    }
}
