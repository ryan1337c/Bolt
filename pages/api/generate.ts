import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import formidable from "formidable";
import fs from "fs";
import pdf from "pdf-parse";
import { requireUser } from "@/lib/requireUser";

type ResponseData = {
    response?: string;
    error?: string;
}

export const config = {
    api: {
        bodyParser: false, // Disable for file uploads
    },
};

const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: "https://api.openai.com/v1"
});

const deepseekClient = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com/v1",
});

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

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const auth = await requireUser(req);
    if (!auth.ok) {
        return res.status(auth.status).json({ error: auth.error });
    }

    try {
        // Parse form data (works for both with/without files)
        const { fields, files } = await parseForm(req);

        const modelId = fields.modelId?.[0];
        const historyStr = fields.history?.[0];

        if (!modelId) {
            return res.status(400).json({ error: "Missing required field: modelId." });
        }

        // Parse history
        let history: Array<any> = [];
        if (historyStr) {
            try {
                history = JSON.parse(historyStr);
            } catch (e) {
                return res.status(400).json({ error: "Invalid history format." });
            }
        }

        // Select client and model
        let activeClient: OpenAI;
        let modelToUse: string;

        if (modelId.includes('deep-seek')) {
            if (!process.env.DEEPSEEK_API_KEY) {
                throw new Error("DeepSeek API key not configured.");
            }
            activeClient = deepseekClient;
            modelToUse = "deepseek-v4-flash";
        } else {
            if (!process.env.OPENAI_API_KEY) {
                throw new Error("OpenAI API key not configured.");
            }
            activeClient = openaiClient;
            modelToUse = modelId === "gpt-4o" || modelId === "claude-sonnet-4" 
                ? "gpt-4o-mini" 
                : "gpt-4o-mini";
        }

        // Check if there are uploaded files
        const uploadedFiles = files.files as formidable.File[] | formidable.File | undefined;
        const fileArray = Array.isArray(uploadedFiles) ? uploadedFiles : uploadedFiles ? [uploadedFiles] : [];

        let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];

        if (fileArray.length > 0) {
            // WITH FILES: Build messages with file content
            const userInput = fields.userInput?.[0] || "";
            
            const userMessageContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
                { type: "text", text: userInput },
            ];

            for (const file of fileArray) {
                if (file.mimetype?.startsWith("image/")) {
                    const fileBuffer = fs.readFileSync(file.filepath);
                    const base64Image = fileBuffer.toString('base64');
                    const dataUrl = `data:${file.mimetype};base64,${base64Image}`;
                    userMessageContent.push({
                        type: "image_url",
                        image_url: { url: dataUrl },
                    });
                } else if (file.mimetype === "application/pdf") {
                    const pdfBuffer = fs.readFileSync(file.filepath);
                    const pdfData = await pdf(pdfBuffer);
                    const combinedText = `\n\n--- PDF File: ${file.originalFilename} ---\n${pdfData.text}`;
                    (userMessageContent[0] as OpenAI.Chat.Completions.ChatCompletionContentPartText).text += combinedText;
                } else {
                    const fileContent = fs.readFileSync(file.filepath, "utf8");
                    const combinedText = `\n\n--- File: ${file.originalFilename} ---\n${fileContent}`;
                    (userMessageContent[0] as OpenAI.Chat.Completions.ChatCompletionContentPartText).text += combinedText;
                }
            }

            // Combine history with the new user message containing files
            messages = [
                ...history,
                {
                    role: "user",
                    content: userMessageContent,
                }
            ];
        } else {
                // WITHOUT FILES: Use history directly
                if (!history || history.length === 0) {
                    return res.status(400).json({ error: "Missing history or files." });
                }
                messages = history;
            }
        
        // Make API call
        const chatCompletion = await activeClient.chat.completions.create({
            model: modelToUse,
            messages: messages,
        });

        const response = chatCompletion.choices[0].message.content;
        const cleanText = response?.replace(/[\u2B00-\u2BFF]/g, '');
        
        return res.status(200).json({ response: cleanText ?? "" });

    }
    catch (error: any) {
        console.error("API Error:", error);
        
        if (error.status === 400) {
            return res.status(400).json({ error: "Bad Request" });
        }
        
        return res.status(error.status || 500).json({ 
            error: error.message || "An internal server error occurred." 
        });
    }
}
