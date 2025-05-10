import { db } from "@/server/db";
import { turndown } from "./turndown";
import { getBulkEmbeddings } from "./embeddings";
import { OramaManager } from "./orama";


export async function embedPendingEmails(chunkSize = 25, accountId: string) {
    // Step 1: Get all pending
    const oramaClient = new OramaManager(accountId)
    oramaClient.initialize()
    const allPending = await db.email.findMany({
        where: { embedding: "pending", userAccountId: accountId },
        orderBy: { createdTime: "asc" }, // optional
        include: {
            from: {
                select: {
                    email: true,
                    name: true
                }
            },
            to: {
                select: {
                    email: true,
                    name: true
                }
            }
        }
    });

    console.log("allpending", allPending.length)

    // Step 2: Chunk them
    for (let i = 0; i < allPending.length; i += chunkSize) {
        const chunk = allPending.slice(i, i + chunkSize);
        const payloads = chunk.map(email => {
            const body = turndown.turndown(email.body ?? email.bodySnippet ?? '')
            const payload = `From: ${email.from.name} <${email.from.email}>\nTo: ${email.to.map(t => `${t?.name} <${t?.email}>`).join(', ')
                }\nSubject: ${email.subject}\nBody: ${body}\n SentAt: ${new Date(email.createdTime).toLocaleString()}`

            return payload
        });
        console.log("i", i)
        try {
            // const result = await getBulkEmbeddings(payloads)

            for (let j = 0; j < chunk.length; j++) {
                const email = chunk[j];
                // const embedding = result[j]
                console.log("j", j)


                await db.email.update({
                    where: { id: email?.id },
                    data: {
                        embedding: "complete",
                    },
                });

                const body = turndown.turndown(email?.body ?? email?.bodySnippet ?? '')

                // await oramaClient.insert({
                //     title: email?.subject,
                //     body: body,
                //     rawBody: email?.bodySnippet ?? '',
                //     from: `${email?.from.name} <${email?.from.email}>`,
                //     to: email?.to.map(t => `${t?.name} <${t?.email}>`),
                //     sentAt: new Date(email?.createdTime as Date).toLocaleString(),
                //     threadId: email?.threadId,
                //     embeddings: embedding
                // })
            }
        } catch (err) {
            console.error("Failed to embed chunk:", err);
            await Promise.all(
                chunk.map(email =>
                    db.email.update({
                        where: { id: email.id },
                        data: { embedding: "failed" },
                    })
                )
            );
        }
    }

    await oramaClient.saveIndex()
}
