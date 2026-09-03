import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs/promises";
import pdf from "pdf-parse";
import { requireEntitlement, requireUser } from "@/lib/requireUser";
import {
    consumeCredits,
    refundCreditsQuietly,
    ContextTooLongError,
    InsufficientCreditsError,
    type CreditReservation,
} from "@/lib/credits";
import {
    assembleResumeTex,
    compileLatex,
    generateJakeResumeBody,
    InvalidResumeLatexError,
    LatexCompileError,
    loadResumeTemplates,
} from "@/lib/resume";

type ResponseData = {
    error?: string;
    code?: string;
    remaining?: number;
    limit?: number;
    resetsAt?: string;
    characters?: number;
    max?: number;
}

export const config = {
    api: {
        bodyParser: false,
    },
    // Sonnet + pdflatex need more than the default Vercel Hobby timeout.
    maxDuration: 60,
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

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData | Buffer>
) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const auth = await requireUser(req);
    if (!auth.ok) {
        return res.status(auth.status).json({ error: auth.error });
    }

    const entitlement = await requireEntitlement(auth.user.id);
    if (!entitlement.ok) {
        return res.status(entitlement.status).json({ error: entitlement.error });
    }

    let reservation: CreditReservation | undefined;

    try {
        const { fields, files } = await parseForm(req);

        const resumeFile = (files.resumeFile as formidable.File[])?.[0];
        const jobDescription = (fields.jobDescription as string[])?.[0];
        const jobTitle = (fields.jobTitle as string[])?.[0];

        if (!resumeFile || !jobDescription) {
            return res.status(400).json({ error: "Missing required fields: resume file, job description, or job title." });
        }

        const fileBuffer = await fs.readFile(resumeFile.filepath);
        const pdfData = await pdf(fileBuffer);
        const resumeText = pdfData.text;

        reservation = await consumeCredits(auth.user.id, {
            kind: "resume",
            textParts: [resumeText, jobDescription, jobTitle ?? ""],
        });

        const templates = await loadResumeTemplates();
        const modelOutput = await generateJakeResumeBody(templates, {
            resumeText,
            jobDescription,
            jobTitle,
        });
        const texSource = assembleResumeTex(templates, modelOutput);
        const pdfBytes = await compileLatex(texSource);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="Tailored_Resume.pdf"');

        return res.status(200).send(Buffer.from(pdfBytes));
    } catch (error: any) {
        if (error instanceof InsufficientCreditsError || error instanceof ContextTooLongError) {
            return res.status(error.status).json(error.toResponseBody());
        }

        await refundCreditsQuietly(reservation);

        console.error("API Error:", error);

        const message =
            error instanceof InvalidResumeLatexError
                ? "Failed to generate a valid resume. Please try again."
                : error instanceof LatexCompileError
                    ? error.message
                    : error.message || "An internal server error occurred.";

        res.status(500).json({ error: message });
    }
}
