import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

type ResponseData = {
    url: string | undefined;
}

interface GenerateRequest extends NextApiRequest {
    body: {
        prompt: string;
        n: number;
        size: string;
    }
}


const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export default async function handler(
    req: GenerateRequest,
    res: NextApiResponse<ResponseData>
) {
    console.log("Hit");
    const promptString = req.body.prompt;
    if (!promptString || undefined) {
        return new Response('you need a prompt', {status: 400})
    }
    const aiResponse = await openai.images.generate({
        model: "dall-e-2",
        prompt: promptString,
        n:1,
        size:"256x256",
    });
    const imageUrl = aiResponse.data[0].url;
    res.status(200).json({url: imageUrl});
}
