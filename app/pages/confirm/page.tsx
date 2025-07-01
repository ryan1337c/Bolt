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
        // navigate to the chat
        navigate(`./login`);
    };

    return(
        <div className="h-screen flex items-center justify-center">
        {mounted && (
            <div className="flex flex-col bg-white text-black p-20 shadow-lg rounded-xl items-center">
            <div className="font font-semibold text-[40px] tracking-widest m-2">Success!</div>
            <div>Email verified. Please log in to continue</div>
            <FontAwesomeIcon beat icon={faCircleCheck} className=" text-emerald-300 text-[200px] mb-28 mt-28"/>
            <button className="bg-emerald-300 text-white text-[30px] rounded-xl pr-10 pl-10 pt-1 pb-1 tracking-wider hover:bg-emerald-400"
            onClick={handleClick}>continue</button>
        </div>
        )}
        </div>
    )
}