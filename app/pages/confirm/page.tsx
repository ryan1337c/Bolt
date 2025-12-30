'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Confirm () {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const navigate = (url: string) => {
        router.push(url);
    }

    const handleClick = async () => {
        navigate(`./login`);
    };

    if (!mounted) {
        return null;
    }

    // After user verifies email for signing up
    return(
        <div className="min-h-screen flex items-center justify-center p-5 bg-landingPageLight dark:bg-landingPage">
            <div className="w-full max-w-lg backdrop-blur-sm p-10 sm:p-20 shadow-xl rounded-xl items-center text-center flex flex-col bg-white/80 text-black dark:bg-slate-800 dark:text-white">
                <h1 className="font-semibold text-4xl sm:text-5xl tracking-wider m-2">Success!</h1>
                <p className="text-slate-600 dark:text-gray-400">Email verified. Please log in to continue.</p>

                <FontAwesomeIcon
                    beat
                    icon={faCircleCheck}
                    className="text-[150px] sm:text-[200px] my-12 sm:my-20 text-emerald-500 dark:text-emerald-400"
                />

                <button
                    className="
                        text-xl sm:text-2xl rounded-xl px-10 py-2 tracking-wider
                        transition-colors duration-300
                        bg-emerald-500 hover:bg-emerald-600 text-white 
                        dark:bg-emerald-400 dark:hover:bg-emerald-500 dark:text-emerald-950
                    "
                    onClick={handleClick}
                >
                    Continue
                </button>
            </div>
        </div>
    )
}