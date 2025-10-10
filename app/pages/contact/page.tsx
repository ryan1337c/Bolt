'use client';

import React, {useEffect, useState} from 'react';
import Link from 'next/link';
import { FaEnvelope, FaGithub, FaLinkedin, FaPaperPlane, FaUser } from 'react-icons/fa';
import Header from '@/app/components/Header';
import { Loader2 } from 'lucide-react';

export default function ContactPage() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'sending' | 'error', message: string}>({
    type: 'idle',
    message: 'Send Message',
  })

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setStatus({ type: 'sending', message: 'Sending...'});
    
    const formData = new FormData(event.currentTarget);

    const data = Object.fromEntries(formData.entries());

    // Retrieve value from data javascript object
    const { name, email, message} = data;

    try {
        const response = await fetch("/api/contact", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                email: email,
                message: message,
            })
        });

        const responseData = await response.json();
        const msg = responseData.message;
        if (response.ok) {
            setStatus({ type: 'idle', message: 'Send Message'});
            // reset form
            (event.target as HTMLFormElement).reset();
        }
        else {
            setStatus({ type: 'error', message: msg });
        }
    }
    catch (error: any) {
        const message = error.message || 'An unexpected error occurred';
        console.error(message);
        setStatus({ type: 'error', message: message});
    }
  };

  return (
    <>
        {mounted && (
            <> 
                <Header />
                <div className="flex flex-col min-h-screen text-white animate-fade-in justify-center">
                    {/* Main container to center content and align with header */}
                    <div className="max-w-5xl mx-auto pt-20">
                        
                        {/* --- Page Header --- */}
                        <div className="text-center mb-8">
                            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white mb-4">
                                Get In Touch
                            </h1>
                            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                                Have a question, a project proposal, or just want to connect? I'd love to hear from you.
                            </p>
                        </div>

                        {/* --- Main Content Box --- */}
                        <div className="bg-slate-900/50 rounded-2xl shadow-lg border border-purple-500/20 p-8 md:p-12">
                            <div className="grid md:grid-cols-2 gap-12 items-start">
                                
                                {/* --- Left Column: Contact Info & Socials --- */}
                                <div className="flex flex-col gap-8">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-white mb-4">Contact Information</h2>
                                        <p className="text-gray-400 mb-6">
                                            Feel free to contact me by email or connect on my professional networks for questions, issues, or suggestions for improvement.
                                        </p>
                                        <a 
                                        href="mailto:ryanchen1337@gmail.com" 
                                        className="flex items-center gap-4 text-lg text-gray-300 hover:text-purple-400 transition-colors duration-300"
                                        >
                                        <FaEnvelope className="text-white size-6" />
                                        <span>ryanchen1337@gmail.com</span>
                                        </a>
                                    </div>
                                
                                    <div>
                                        <h2 className="text-2xl font-semibold text-white mb-4">Follow Me</h2>
                                        <div className="flex items-center gap-6">
                                            <Link href="https://github.com/ryan1337c" target="_blank" rel="noopener noreferrer">
                                                <FaGithub className="text-gray-400 hover:text-white transition-colors duration-300 size-8" />
                                            </Link>
                                            <Link href="https://www.linkedin.com/in/ryan-chen-296094239/" target="_blank" rel="noopener noreferrer">
                                                <FaLinkedin className="text-gray-400 hover:text-white transition-colors duration-300 size-8" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* --- Right Column: Contact Form --- */}
                                <div>
                                <h2 className="text-2xl font-semibold text-white mb-4">Send a Message</h2>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name Input */}
                                    <div className="relative">
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow duration-300"
                                        placeholder="Your Name"
                                    />
                                    <FaUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                    </div>
                                    
                                    {/* Email Input */}
                                    <div className="relative">
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow duration-300"
                                        placeholder="Your Email"
                                    />
                                    <FaEnvelope className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                    </div>

                                    {/* Message Textarea */}
                                    <div>
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows={5}
                                            required
                                            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow duration-300"
                                            placeholder="Your Message"
                                        ></textarea>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                    type="submit"
                                    disabled={status.type === 'sending'}
                                    className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all duration-300 disabled:bg-purple-800 disabled:cursor-not-allowed"
                                    >
                                    {status.type === 'sending' ? (
                                        <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>{status.message}</span>
                                        </>
                                    ) : (
                                        <>
                                        <span>{status.message}</span>
                                        <FaPaperPlane />
                                        </>
                                    )}
                                    </button>
                                </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )}
        
    </>
  );
}