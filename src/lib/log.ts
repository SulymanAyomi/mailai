import { db } from "@/server/db";

export async function logSync({ type, status, message, meta }: SyncLogParams) {
    try {
        await db.syncLog.create({
            data: {
                type,
                status,
                message,
                meta,
            },
        });

        if (process.env.NODE_ENV === 'development') {
            console.log(`[${type.toUpperCase()}] ${status.toUpperCase()}: ${message}`, meta || '');
        }
    } catch (err) {
        console.error('Failed to write sync log:', err);
    }
}