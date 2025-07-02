import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { AuthServices } from "@/lib/authServices";

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

const auth = new AuthServices();
const supabase = auth.client;

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export default async function handler(
    req: GenerateRequest,
    res: NextApiResponse<ResponseData>
) {
    console.log("Hit");
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const promptString = req.body.prompt;
    if (!promptString) {
      return res.status(400).json({ error: "You need a prompt" });
    }

    try{
    const aiResponse = await openai.images.generate({
        prompt: promptString,
        n:1,
        size:"1024x1024",
        model: "dall-e-3"
    });

    if (!aiResponse.data || aiResponse.data.length === 0) {
      return res.status(500).json({ error: "No images generated" });
    }
    const imageUrl = aiResponse.data[0].url;

    if (!imageUrl || typeof imageUrl !== "string") {
        return res.status(500).json({ error: "Invalid or missing image URL from OpenAI" });
    }

    // Fetch the image and convert into blob 
    const imageResponse = await fetch(imageUrl);
    const blob = await imageResponse.blob();

    // Upload to supabase storage
    const fileName = `dalle/${Date.now()}.png`;
    const { data, error: uploadError } = await supabase.storage
    .from('images') 
    .upload(fileName, blob, {
        contentType: "image/png"
    });

    if (uploadError) {
        console.error(uploadError);
        return res.status(500).json({ error: "Failed to upload iamge to supabase"})
    }

    // Get public url and convert to filepath
    const { data: publicData } = supabase.storage.from('images').getPublicUrl(fileName);
    const publicUrl = publicData.publicUrl;
    const filePath = publicUrl.split("/images/")[1];

    return res.status(200).json({ url: filePath });
}
catch (error: any) {

    if (error.status === 400)
        return res.status(400).json({error: "Bad Request"})
    else 
        return res.status(error.status).json({error: "OpenAI server issue"})
}
}