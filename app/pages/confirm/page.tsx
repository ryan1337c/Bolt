'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTheme } from "next-themes";

export default function Confirm () {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const { theme } = useTheme();

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

    return(
        <div className={`min-h-screen flex items-center justify-center p-5 ${theme === 'dark' ? 'bg-landingPage' : 'bg-landingPageLight'}`}>
            <div className={`w-full max-w-lg backdrop-blur-sm p-10 sm:p-20 shadow-xl rounded-xl items-center text-center flex flex-col ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-white/80 text-black'}`}>
                <h1 className="font-semibold text-4xl sm:text-5xl tracking-wider m-2">Success!</h1>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>Email verified. Please log in to continue.</p>

                <FontAwesomeIcon
                    beat
                    icon={faCircleCheck}
                    className={`text-[150px] sm:text-[200px] my-12 sm:my-20 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'}`}
                />

                <button
                    className={`
                        text-xl sm:text-2xl rounded-xl px-10 py-2 tracking-wider
                        transition-colors duration-300
                        ${theme === 'dark'
                            ? 'bg-emerald-400 hover:bg-emerald-500 text-emerald-950'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }
                    `}
                    onClick={handleClick}
                >
                    Continue
                </button>
            </div>
        </div>
    )
}