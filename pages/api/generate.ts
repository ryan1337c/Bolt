import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

type ResponseData = {
    response?: string;
    error?: string;
}

interface GenerateRequest extends NextApiRequest {
    body: {
        history: Array<any>;
        modelId: string;
    }
}

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1"
});

export default async function handler(
    req: GenerateRequest,
    res: NextApiResponse<ResponseData>
) {
    const {history, modelId} = req.body;

    console.log("Here is the chat history: ", history);
    console.log("Here is the model: ", modelId);


    // Add validation
    if (!history || !Array.isArray(history)) {
        return res.status(400).json({ error: 'History must be an array' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Handle Models
    if (modelId === "gpt-4o" || "claude-sonnet-4") {
        openai.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY!;
        openai.baseURL = "https://api.openai.com/v1/"
    }
    else if (modelId === "deep-seek") {
        openai.apiKey = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY!;
        openai.baseURL = "https://api.deepseek.com/v1/"
    }

    let model = modelId === "gpt-4o" || "claude-sonnet-4" ? "gpt-4o-mini" : modelId === "deep-seek" ? "deepseek-chat" : (() => {
        throw new Error(`Unsupported modelId: ${modelId}`);
      })();

    try{

        const aiResponse = await openai.chat.completions.create({
            model: model,
            messages: history,
        });
        const responseMessage = aiResponse.choices[0].message.content;
        const cleanText = responseMessage?.replace(/[\u2B00-\u2BFF]/g, '');
        console.log(`Response from ${modelId}`, responseMessage);
        return res.status(200).json({ response: cleanText });
    }
    catch(error: any) {
        if (error.status === 400)
            return res.status(400).json({error: "Bad Request cooked"})
        else 
            return res.status(error.status).json({error: "OpenAI server issue"})
    }

}
