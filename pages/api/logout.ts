import { AuthServices } from '@/lib/authServices';
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
    req: NextApiRequest, res: NextApiResponse
){
    if (req.method !== 'GET') return res.status(405).end();

    const auth = new AuthServices();

    try{
        await auth.logout();
        res.status(200).json({ result: true});
    }
    catch(err: any) {
        res.status(401).json({ error: "Failed to logout" });
    }
}

/* Not needed anymore */