import { create, insert, search, save, load, type AnyOrama } from "@orama/orama";
import { persist, restore } from "@orama/plugin-data-persistence";
import { db } from "@/server/db";
import { getEmbeddings } from "@/lib/embeddings";

export class OramaManager {
    // @ts-ignore
    private orama: AnyOrama;
    private accountId: string;

    constructor(accountId: string) {
        this.accountId = accountId;
    }

    async initialize() {
        const account = await db.userAccount.findUnique({
            where: { id: this.accountId },
            select: { oramaIndex: true }
        });

        if (!account) throw new Error('Account not found');

        if (account.oramaIndex) {
            this.orama = await restore('json', account.oramaIndex as any);
        } else {
            this.orama = await create({
                schema: {
                    subject: "string",
                    body: "string",
                    from: 'string',
                    to: 'string[]',
                    sentAt: 'string',
                    embeddings: 'vector[1536]',
                    threadId: 'string'
                },
            });
            await this.saveIndex();
        }
    }

    async insert(document: any) {
        await insert(this.orama, document);
        await this.saveIndex();
    }

    async vectorSearch({ prompt, numResults = 10 }: { prompt: string, numResults?: number }) {
        const embeddings = await getEmbeddings(prompt)
        console.log(embeddings)
        const results = await search(this.orama, {
            mode: 'hybrid',
            term: prompt,
            vector: {
                value: embeddings as number[],
                property: 'embeddings'
            },
            similarity: 0.80,
            limit: numResults,
            // hybridWeights: {
            //     text: 0.8,
            //     vector: 0.2,
            // }
        })
        return results
    }
    async search({ term }: { term: string }) {
        return await search(this.orama, {
            term: term,
        });
    }

    async saveIndex() {
        const index = await persist(this.orama, 'json');
        await db.userAccount.update({
            where: { id: this.accountId },
            data: { oramaIndex: index as Buffer }
        });
    }
}

