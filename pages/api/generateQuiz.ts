import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

type ResponseData = {
    quiz?: QuizQuestion[];
    error?: string;
}

// Define the shape of the data we want back from the AI
type QuizQuestion = {
    question_text: string;
    options: string[];
    correct_index: number; // 0-4
};


interface GenerateRequest extends NextApiRequest {
    body: {
        title: string;
        topic: string;
        questionCount: Number;
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
    
    const { title, topic, questionCount } = req.body;

    console.log(`title: ${title} topic ${topic} count ${questionCount}`)
    
    try {
        // We construct a specific system prompt to force the format we need
        const developerPrompt = `You are a helpful quiz generator. 
        You must generate a valid JSON object containing an array of multiple-choice questions. 
        Each question must have exactly 5 options. 
        The "correct_index" must be an integer between 0 and 4 corresponding to the correct option.`;

        const userPrompt = `Generate a quiz with exactly ${questionCount} questions based on this topic: "${topic}".
        The title of the quiz is "${title}".
        
        Return the output in this exact JSON format:
        {
            "questions": [
                {
                    "question_text": "The question string here",
                    "choices": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
                    "correct_index": 0
                }
            ]
        }`;

        const completion = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
            { role: "system", content: developerPrompt },
            { role: "user", content: userPrompt }
        ]
        });

        // Parse the response
        const content = completion.choices[0].message.content;
        
        if (!content) {
            throw new Error("No content received from OpenAI");
        }

        const parsedData = JSON.parse(content);

        console.log(content)

        // Return the array of questions
        return res.status(200).json({ quiz: parsedData.questions });

    } catch (error: any) {
        console.error("Error generating quiz:", error);
        return res.status(500).json({ 
            error: error.message || "Failed to generate quiz" 
        });
    }
}