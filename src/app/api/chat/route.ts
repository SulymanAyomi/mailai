import { streamText } from "ai";

import { NextResponse } from "next/server";
import { OramaManager } from "@/lib/orama";
import { db } from "@/server/db";
// import { getSubscriptionStatus } from "@/lib/stripe-actions";
import { FREE_CREDITS_PER_DAY } from "@/constansts";
import { auth } from "@/server/auth";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { GEMINI_AI } from "@/config";

// export const runtime = "edge";



export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
        const userId = session.user.id
        if (!userId) {
            return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
        }
        // const isSubscribed = await getSubscriptionStatus()
        // if (!isSubscribed) {
        const chatbotInteraction = await db.chatbotInteraction.findUnique({
            where: {
                day: new Date().toDateString(),
                userId
            }
        })
        if (!chatbotInteraction) {
            await db.chatbotInteraction.create({
                data: {
                    day: new Date().toDateString(),
                    count: 1,
                    userId
                }
            })
        } else if (chatbotInteraction.count >= FREE_CREDITS_PER_DAY) {
            return NextResponse.json({ error: "Limit reached" }, { status: 429 });
        }

        const { messages, accountId } = await req.json();
        const oramaManager = new OramaManager(accountId)
        await oramaManager.initialize()

        const lastMessage = messages[messages.length - 1]


        const context = await oramaManager.vectorSearch({ prompt: lastMessage.content })
        console.log(context.hits.length + ' hits found')
        // console.log(context.hits.map(hit => hit.document))

        const prompt = {
            role: "system",
            content: `You are an AI email assistant embedded in an email client app. Your purpose is to help the user compose emails by answering questions, providing suggestions, and offering relevant information based on the context of their previous emails.
            THE TIME NOW IS ${new Date().toLocaleString()}
      
      START CONTEXT BLOCK
      ${context.hits.map((hit) => JSON.stringify(hit.document)).join('\n')}
      END OF CONTEXT BLOCK
      
      When responding, please keep in mind:
      - Be helpful, clever, and articulate.
      - Rely on the provided email context to inform your responses.
      - If the context does not contain enough information to answer a question, politely say you don't have enough information.
      - Avoid apologizing for previous responses. Instead, indicate that you have updated your knowledge based on new information.
      - Do not invent or speculate about anything that is not directly supported by the email context.
      - Keep your responses concise and relevant to the user's questions or the email being composed.`
        };

        const google = createGoogleGenerativeAI({
            apiKey: GEMINI_AI
        });
        const results = streamText({
            model: google("gemini-1.5-pro"),
            system: prompt.content,
            messages
        })
        return results.toDataStreamResponse()
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "error" }, { status: 500 });
    }
}
