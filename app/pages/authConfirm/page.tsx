'use client'
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/app/context/AuthContext";

export default function AuthConfirm() {
    const router = useRouter();
    const [mounted, setMount] = useState(false);

    const {isLoggedIn} = useAuth();

    useEffect(() => {
        setMount(true);
    }, []);

    useEffect(() => {
        // Redirect
        if (mounted && isLoggedIn) {
            router.push("/pages/home");
        }
    }, [mounted, isLoggedIn])


    return(
        <div className="h-screen flex items-center justify-center">
        {mounted && (
            <div className="flex flex-col bg-white text-black p-20 shadow-lg rounded-xl items-center">
            <div className="font font-semibold text-[40px] tracking-wide m-2">Redirecting</div>
              <svg
              className="animate-spin text-emerald-500 size-16 mt-9"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-40"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
        </div>
        )}
        </div>
    )
   
}
