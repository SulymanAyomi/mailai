import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { OramaManager } from "@/lib/orama";

export const searchRouter = createTRPCRouter({
    search: protectedProcedure.input(z.object({
        accountId: z.string(),
        query: z.string(),
    })).mutation(async ({ input, ctx }) => {
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
        const oramaManager = new OramaManager(account.id);
        await oramaManager.initialize();


        const { query } = input;
        const results = await oramaManager.search({ term: query });
        return results
    }),
});
