"use client"
import Link from 'next/link';
import IconRobot from './IconRobot';
import { useAuth } from './context/AuthContext';
import { AuthServices } from '@/lib/authServices';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightToBracket, faUserPlus, faRocket} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SparklesText } from "@/components/magicui/sparkles-text";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FlipText } from "@/components/magicui/flip-text";
import { TypingAnimation } from "@/components/magicui/typing-animation";

export default function Home() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

  const { isLoggedIn } = useAuth();


  return (
    <div className="flex flex-col min-h-screen text-white overflow-hidden">
      {mounted && <><div className="ml-auto pr-6 pt-3">
          {isLoggedIn ? <>
            <Link href={`./`}>  
              <button className="m-5 p-2 inline-block buttonEffects hover:bg-hoverLandingPage" onClick={async() => {
                const auth = new AuthServices();
                await auth.logout();
              }}>Sign Out</button>
            </Link> 
            
          </> : <div className="flex">
            <Link href={`./pages/login`}>  
            <button className="p-2 flex gap-2 items-center buttonEffects hover:bg-hoverLandingPage ">
              <FontAwesomeIcon icon={faArrowRightToBracket} />
              Log In</button>
            </Link> 
            <Link href={`./pages/register`}>
              
              <button className="p-2 ml-3 flex gap-2 items-center buttonEffects hover:bg-hoverLandingPage">
                <FontAwesomeIcon icon={faUserPlus}/>
                Sign Up</button>
            </Link>
          </div>}      
      </div>
      <div className="flex flex-col items-center lg:flex-row px-4 ">
        {/* Left Side */}
        <div className="md:w-1/2 mt-20 min-h-[60vh]">
          <div className="flex flex-col items-center md:flex-none md:items-start lg:ml-40">
            <SparklesText className="sm:text-8xl lg:text-9xl -ml-[0.4rem]" sparklesCount={5}>Bolt</SparklesText>
            <div className="sm:text-3xl md:text-4xl font-bold flex gap-2">
              <FlipText className="text-purple-500">Fast.</FlipText>
              <FlipText className="text-purple-300">Smart.</FlipText>  
              <FlipText className="text-purple-100">Limitless.</FlipText>
            </div>
            <TypingAnimation className="mt-8 mb-6">
              Unlock the power of AI models — Bolt connects you with cutting-edge agents to supercharge your workflows, automate tasks, and amplify your creativity. Fast, smart, limitless. Your AI assistant, reimagined.
            </TypingAnimation>
            <div className="sm:flex sm:justify-center lg:flex-none lg:justify-start">
              <button className="buttonEffects !bg-launch p-3 flex gap-2 items-center rounded-lg" id="launch" onClick={() => {
              router.push("/pages/home")
              }}>
                <FontAwesomeIcon icon={faRocket} id="rocket"/>
                Launch App
              </button>
            </div>
          </div>
        </div>
        
        {/* Right Side */}
        <div className="md:w-1/2 flex justify-center item-start ">
          <DotLottieReact
            src="https://lottie.host/bd5cdb29-22ca-4570-9be6-8bf14baced57/gf7DNNCIz5.lottie"
            autoplay
            loop
            className="w-[400px] h-[250px] md:w-[500px] md:h-[350px] flex-shrink-0"
          />
        </div>
</div></>}
    </div>
)


}
