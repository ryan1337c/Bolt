import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";
import pdf from "pdf-parse"; 

type ResponseData = {
    response?: string;
    imageUrl?: string;
    error?: string;
}

export const config = {
    api: {
        bodyParser: false,
    },
};

const parseForm = (req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
    return new Promise((resolve, reject) => {
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => {
            if (err) {
                reject(err);
            } else {
                resolve({ fields, files });
            }
        });
    });
};

const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
    baseURL: "https://api.openai.com/v1"
});

const deepseekClient = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY, 
    baseURL: "https://api.deepseek.com/v1",
});


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { fields, files } = await parseForm(req);
        
        const userContext = fields.userInput?.[0] || "";
        const llmModel = fields.modelId?.[0];

        if (!userContext || !llmModel) {
            return res.status(400).json({ error: "Missing required fields: userInput or modelId." });
        }

        let activeClient: OpenAI;
        let modelToUse: string;

        // Use a more robust check for model selection
        if (llmModel.includes('deep-seek')) {
            if (!process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY) throw new Error("DeepSeek API key not configured.");
            activeClient = deepseekClient;
            modelToUse = "deepseek-chat"; 
        } else {
            // Default to OpenAI for models like gpt-4o, claude, etc.
            if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) throw new Error("OpenAI API key not configured.");
            activeClient = openaiClient;
            modelToUse = "gpt-4o-mini"; 
        }
        
        const uploadedFiles = files.files as formidable.File[] | undefined;
        const userMessageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
            { type: "text", text: userContext },
        ];

        if (uploadedFiles && uploadedFiles.length > 0) {
            // Use a for...of loop for async/await compatibility
            for (const file of uploadedFiles) {
                if (file.mimetype?.startsWith("image/")) {
                    const fileBuffer = fs.readFileSync(file.filepath);
                    const base64Image = fileBuffer.toString('base64');
                    const dataUrl = `data:${file.mimetype};base64,${base64Image}`;
                    userMessageContent.push({
                        type: "image_url",
                        image_url: { url: dataUrl },
                    });
                } 
                else if (file.mimetype === "application/pdf") {
                    const pdfBuffer = fs.readFileSync(file.filepath);
                    // pdf-parse is async, so we need to await it
                    const pdfData = await pdf(pdfBuffer);
                    const combinedText = `\n\n--- PDF File: ${file.originalFilename} ---\n${pdfData.text}`;
                    (userMessageContent[0] as OpenAI.Chat.Completions.ChatCompletionContentPartText).text += combinedText;
                } 
                else { // For all other text-based files
                    const fileContent = fs.readFileSync(file.filepath, "utf8");
                    const combinedText = `\n\n--- File: ${file.originalFilename} ---\n${fileContent}`;
                    (userMessageContent[0] as OpenAI.Chat.Completions.ChatCompletionContentPartText).text += combinedText;
                }
            }
        }
        // console.log("uploaded files", uploadedFiles)
        // console.log("message content", userMessageContent)

        const chatCompletion = await activeClient.chat.completions.create({
            model: modelToUse,
            messages: [
                {
                    role: "user",
                    content: userMessageContent,
                },
            ],
        });

        const response = chatCompletion.choices[0].message.content;
        return res.status(200).json({ response: response ?? "" });

    } catch (error: any) {
        console.error("API Error:", error);
        res.status(500).json({ error: error.message || "An internal server error occurred." });
    }
}