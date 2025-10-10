import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from 'nodemailer';

export default async function handler(
    req: NextApiRequest, res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, message } = req.body;

    if (!name || !email || !message )
        return res.status(404).json({ error: 'Missing resources'});

    try {
        // Configure the nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_FROM,
                pass: process.env.EMAIL_APP_PASSWORD
            }
        });

        // Define the email options
        const mailOptions = {
            from: `"${name}" <${process.env.EMAIL_FROM}>`,
            to: process.env.EMAIL_FROM,
            replyTo: email,
            subject: `New message from ${name} via Omni Contact Form`,
            text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
            html: `
                <h1>New Contact Form Submission</h1>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <hr>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `,
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: 'Message sent!'})
    }
    catch (error: any) {
        return res.status(500).json({ error: 'Error in sending email!'})
    }
    
}