'use client'
import { useEffect, useState } from 'react';
import { AuthServices } from '@/lib/authServices';

export default function ForgotPassword () {
    const [mounted, setMounted] = useState(false);

    // new password var
    const [email, setEmail] = useState("");

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
   
    useEffect(() => {
    setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const auth = new AuthServices();
        setMessage('');
        setError('');
        try{
            // Send password reset link to email
            await auth.sendResetLink(email);
            setMessage('If an account with that email exists, a password reset link has been sent');
        }
        catch (error: any) {
            const message = error.message || 'An unexpected error occurred';
            console.error(message);
            setError(message);
        }
    }

    return(
        <div className="h-screen flex items-center justify-center">
        {mounted && (
            <div className="flex flex-col bg-white text-black p-10 md:w-[500px] shadow-lg rounded-xl items-center">
                <div className="font font-bold text-[30px] m-2 ">Forgot password</div>
                <div className="mb-8 text-[14px]">Enter your email to receive a password reset link</div>
                <form className="w-full flex flex-col gap-7 text-[15px]" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-2">
                        <label className="text-left font-semibold">Email</label>
                        <input className="bg-white text-black px-4 py-2 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-2" 
                        id="email" name="email" placeholder='Enter email' type="email" required 
                        onChange={(e) => setEmail(e.target.value)}></input>
                        <div className="text-2xl leading-9 tracking-tight flex flex-col items-center gap-2">
                            <label className={`text-error text-sm ${error ? 'visible' : 'invisible'}`}>{error || ''}</label>
                            <label className={`text-sm ${message ? 'visible' : 'invisible'}`}>{message || '\u00A0'}</label> 
                        </div>
                    </div>
                    <button type="submit" className="bg-launch p-3 tracking-wider text-white rounded-md 
                    shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:bg-[#2A3953]">SEND</button>
                </form>

        </div>
        )}
        </div>
    )
}