'use client'
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthServices } from '@/lib/authServices';

export default function NewPassword () {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // new password var
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState('');

    useEffect(() => {
    setMounted(true);
    }, []);

    const navigate = (url: string) => {
        router.push(url);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match. Please try again');
            return;
        }

        const auth = new AuthServices();
        try{
            // Reset password
            await auth.updateUser(newPassword);
            console.log("Password successfully changed: ", newPassword);

            navigate('../login')
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
            <div className="flex flex-col bg-white text-black p-10 shadow-lg rounded-xl items-center">
                <div className="font font-bold text-[30px] m-2 ">Change password</div>
                <div className="mb-10 text-[14px]">Enter a new password below to change your password</div>
                <div className="text-2xl mb-3 leading-9 tracking-tight flex flex-col items-center gap-2">
                    <label className={`text-error text-sm ${error ? 'visible' : 'invisible'}`}>{error || ''}</label>
                </div>
                <form className="w-full flex flex-col gap-7 text-[15px]" onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-2">
                        <label className="text-left font-semibold">New password</label>
                        <input className="bg-white text-black px-4 py-2 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-2" 
                        id="newPassword" name="newPassword" placeholder='New password' type={showPassword ? 'text' : 'password'} required 
                        onChange={(e) => setNewPassword(e.target.value)}></input>
                        {/* <button
                            type="button"
                            className="absolute text-gray-500"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        ><FontAwesomeIcon icon={showPassword ? faEyeSlash: faEye} /></button> */}
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-left font-semibold">Confirm password</label>
                        <input className="bg-white text-black px-4 py-2 rounded-md shadow-[0_4px_12px_rgba(0,0,0,0.3)] focus:outline-none focus:ring-2
                        " id="confirmPassword" name="confirmPassword" placeholder='Confirm your password' type="password" required 
                        onChange={(e) => setConfirmPassword(e.target.value)}></input>
                    </div>
                    <button type="submit" className="bg-launch p-3 tracking-wider text-white rounded-md 
                    shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:bg-[#2A3953]">CHANGE PASSWORD</button>
                </form>

        </div>
        )}
        </div>
    )
}