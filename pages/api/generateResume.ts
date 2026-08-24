import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import formidable from "formidable";
import fs from 'fs/promises';
import pdf from "pdf-parse"; 
import  { createPdfFromData } from '@/lib/generatePdf';

// Define a type for the structured resume data
type ResumeData = {
    name: string;
    email: string;
    phone: string;
    linkedIn?: string;
    github?: string;
    education?: Array<{
        degree: string; 
        institution: string;
        date: string; 
        bulletPoints?: string[]; 
    }>;
    projects?: Array<{
        name: string;
        date: string;
        technologies: string;
        bulletPoints: string[];
    }>;
    experiences: Array<{
        title: string;
        company: string;
        date: string;
        bulletPoints: string[];
    }>;
    skills?: Array<{
        category: string; 
        skills: string[]; 
    }>;
};

type ResponseData = {
    error?: string
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


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | Buffer> 
) {
    try{
        const { fields, files } = await parseForm(req);

        const resumeFile = (files.resumeFile as formidable.File[])?.[0];
        const jobDescription = (fields.jobDescription as string[])?.[0];
        const jobTitle = (fields.jobTitle as string[])?.[0];

        if (!resumeFile || !jobDescription) {
            return res.status(400).json({ error: "Missing required fields: resume file, job description, or job title." });
        }

        // Extract text from uploaded PDF
        const fileBuffer = await fs.readFile(resumeFile.filepath);
        const pdfData = await pdf(fileBuffer);
        const resumeText = pdfData.text;

        // Structure the resume text
        const structurePrompt = `
            Extract the content from the following resume text into a structured JSON object. 
            If linkedIn, github, summary, or projects is not provided skip, otherwise make sure 
            the JSON object has the rest.
            type ResumeData = {
                name: string; // The full name of the person
                email: string;
                phone: string;
                linkedIn: string; // e.g. linkedin.com/in/ryan-chen-296094239
                github: string // e.g. github.com/ryan1337c
                education?: Array<{
                    degree: string; // The full degree name, e.g., "Bachelor of Science in Computer Science, Honours"
                    institution: string; // The university and school, e.g., "Lassonde School of Engineering York University, Toronto"
                    date: string; // The graduation date, e.g., "Expected May 2026"
                    bulletPoints?: string[]; // Optional details like GPA or coursework, e.g., ["GPA: 3.5", "Relevant Coursework: ..."]
                }>;
                projects: Array<{
                    name: string;
                    date: string;
                    technologies: string;
                    bulletPoints: string[];
                }>;
                experiences: Array<{
                    title: string;
                    company: string;
                    date: string; // e.g., "Jan 2020 - Present"
                    bulletPoints: string[];
                }>;
                skills?: Array<{
                    category: string; // The sub-header, e.g., "Languages & Frameworks"
                    skills: string[]; // The list of skills for that category
                }>;
            };
            For the 'skills' section, group related skills under appropriate categories like "Languages & Frameworks", "Libraries", "Databases", "Tools", etc., based on the content of the resume.
            RESUME TEXT: """${resumeText}"""
            Provide only the JSON object as your response.`;

            // 1. API call to generate json
            const structureResponse = await openaiClient.chat.completions.create({
                model: "gpt-4-1106-preview",
                messages: [{ role: "user", content: structurePrompt}],
                response_format: { type: "json_object"},
                temperature: 0.2,
            });

            const structuredResume: ResumeData = JSON.parse(structureResponse.choices[0].message.content || '{}');

            const tailorPrompt = `
            You are an expert resume writer. Your task is to tailor the provided resume (in JSON format) to better match the given job description.
            Tailor the "bulletPoints" for each experience to highlight the skills and achievements most relevant to the job description.
            Also, if user provides "projects", tailor "bulletPoints" for each project without deleteing or adding new points. For the "skills" section, 
            do not add new points. 
            Do not change the structure of the JSON. Only modify the content of the specified fields.
            
            JOB TITLE: """${jobTitle}"""

            JOB DESCRIPTION: """${jobDescription}"""

            ORIGINAL RESUME JSON: """${JSON.stringify(structuredResume, null, 2)}"""
            
            Return the new, tailored resume as a single, valid JSON object.`;
            
            // 2. API call to tailor structured resume
            const tailorResponse = await openaiClient.chat.completions.create({
                model: "gpt-4-1106-preview",
                messages: [{ role: "user", content: tailorPrompt }],
                response_format: { type: "json_object" },
                temperature: 0.2,
            })

            const tailoredResumeData: ResumeData = JSON.parse(tailorResponse.choices[0].message.content || '{}');

            // Generate a new pdf from the tailored data
            const pdfBytes = await createPdfFromData(tailoredResumeData);

            // Set appropriate headers for a PDF file download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="Tailored_Resume.pdf');

            // Return the generated pdf back to client
            return res.status(200).send(Buffer.from(pdfBytes));


    }
    catch (error: any) {
        console.error("API Error:", error);
        res.status(500).json({ error: error.message || "An internal server error occurred." });
    }
}