import { GoogleGenAI } from "@google/genai";
import { GEMINI_AI } from "@/config";





export async function getEmbeddings(text: string) {
    try {
        const genAI = new GoogleGenAI({
            apiKey: GEMINI_AI,
        });

        const res = await genAI.models.embedContent({
            model: "gemini-embedding-exp-03-07",
            contents: text,
            config: {
                taskType: "RETRIEVAL_DOCUMENT",
                outputDimensionality: 1536
            }
        })

        const result = res.embeddings?.map((e) => e.values)
        if (result != undefined) {
            const emb = result[0]
            return emb as number[]
        }
    } catch (error) {
        console.log("error calling openai embeddings api", error);
        throw error;
    }
}

export async function getBulkEmbeddings(text: string[]) {
    try {

        const genAI = new GoogleGenAI({
            apiKey: GEMINI_AI,
        });

        const res = await genAI.models.embedContent({
            model: "gemini-embedding-exp-03-07",
            contents: text,
            config: {
                taskType: "RETRIEVAL_DOCUMENT"
            }
        })

        const result = res.embeddings?.map((e) => e.values)
        console.log(result)
        return result as unknown as number[]
    } catch (error) {
        console.log("error calling openai embeddings api", error);
        throw error;
    }
}
