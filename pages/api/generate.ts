import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

type ResponseData = {
    url?: string;
    error?: string;
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
    try{
    const aiResponse = await openai.images.generate({
        prompt: promptString,
        n:1,
        size:"1024x1024",
    });

    const imageUrl = aiResponse.data[0].url;
    res.status(200).json({url: imageUrl});
}
catch (error: any) {

    if (error.status === 400)
        return res.status(400).json({error: "Bad Request"})
    else 
        return res.status(error.status).json({error: "OpenAI server issue"})
}
}
