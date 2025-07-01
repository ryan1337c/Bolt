// import type { NextApiRequest, NextApiResponse } from "next";
// import OpenAI from "openai";

// type ResponseData = {
//     url?: string;
//     error?: string;
// }

// interface GenerateRequest extends NextApiRequest {
//     body: {
//         prompt: string;
//         n: number;
//         size: string;
//     }
// }

// const openai = new OpenAI({
//     apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
// });

// export default async function handler(
//     req: GenerateRequest,
//     res: NextApiResponse<ResponseData>
// ) {
//     console.log("Hit");
//     if (req.method !== 'POST') {
//       return res.status(405).json({ error: 'Method not allowed' });
//     }

//     const promptString = req.body.prompt;
//     if (!promptString) {
//       return res.status(400).json({ error: "You need a prompt" });
//     }

//     try{
//     const aiResponse = await openai.images.generate({
//         prompt: promptString,
//         n:1,
//         size:"1024x1024",
//         model: "dall-e-3"
//     });

//     if (!aiResponse.data || aiResponse.data.length === 0) {
//       return res.status(500).json({ error: "No images generated" });
//     }
//     const imageUrl = aiResponse.data[0].url;
//     res.status(200).json({url: imageUrl});
// }
// catch (error: any) {

//     if (error.status === 400)
//         return res.status(400).json({error: "Bad Request"})
//     else 
//         return res.status(error.status).json({error: "OpenAI server issue"})
// }
// }

import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

type ResponseData = {
  url?: string;
  error?: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!, // do NOT use NEXT_PUBLIC here
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    // GPT-4o image generation using chat completions
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      // @ts-ignore - 'modalities' is not typed in SDK yet
      modalities: ["text", "image"],
      messages: [{ role: "user", content: prompt }],
    } as any); // Use 'as any' to bypass type limitations

    const message = response.choices[0].message as any;

    if (!message.image?.url) {
      return res.status(500).json({ error: "No image was generated" });
    }

    res.status(200).json({ url: message.image.url });
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    return res
      .status(error.status || 500)
      .json({ error: error.message || "Image generation failed" });
  }
}




