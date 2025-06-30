import { AuthServices } from '@/lib/authServices';
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest, res: NextApiResponse
){
    if (req.method !== 'POST') return res.status(405).end();

    const { email, password } = req.body;
    const auth = new AuthServices();

    try{
        const result = await auth.login(email, password);
        res.status(200).json(result);
    }
    catch(error: any) {
        const status = error.status || 500; // fallback to 500 Internal Server Error
        const message = error.message || 'An unexpected error occurred';
        res.status(status).json({ error: message });
    }
}

/* Not needed anymore */