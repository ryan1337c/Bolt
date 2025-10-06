"use client"
import Link from 'next/link';
import { useAuth } from './context/AuthContext';
import { AuthServices } from '@/lib/authServices';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightToBracket, faUserPlus, faRocket} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SparklesText } from "@/components/magicui/sparkles-text";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FlipText } from "@/components/magicui/flip-text";
import { Beam } from '@/components/magicui/beam';
import { useInView } from 'react-intersection-observer';
import { MarqueeDemo } from '@/components/magicui/review-cards';
import { FaStar, FaGithub } from 'react-icons/fa';
import CountUp from 'react-countup';

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { isLoggedIn } = useAuth();

  // Observer for the User Count section
  const { ref: userCountRef, inView: userCountInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  // Observer for the Unified Core section
  const { ref: coreRef, inView: coreInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  // Observer for the Testimonies section
  const { ref: testimoniesRef, inView: testimoniesInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  // Obeserver for the First section
  const { ref: robotRef, inView: robotInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <div className="flex flex-col min-h-screen text-white overflow-hidden">
      {mounted && (
        <>
          <div className="ml-auto pr-6 pt-3 animate-fade-in">
            {isLoggedIn ? (
              <>
                <Link href={`./`}>
                  <button
                    className="m-5 p-2 inline-block buttonEffects hover:bg-hoverLandingPage"
                    onClick={async () => {
                      const auth = new AuthServices();
                      await auth.logout();
                    }}
                  >
                    Sign Out
                  </button>
                </Link>
              </>
            ) : (
              <div className="flex">
                <Link href={`./pages/login`}>
                  <button className="p-2 flex gap-2 items-center buttonEffects hover:bg-hoverLandingPage ">
                    <FontAwesomeIcon icon={faArrowRightToBracket} />
                    Log In
                  </button>
                </Link>
                <Link href={`./pages/register`}>
                  <button className="p-2 ml-3 flex gap-2 items-center buttonEffects hover:bg-hoverLandingPage">
                    <FontAwesomeIcon icon={faUserPlus} />
                    Sign Up
                  </button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center lg:flex-row px-4">
            {/* Left Side */}
            <div className="md:w-1/2 mt-16 min-h-[45vh]">
              <div className="flex flex-col items-center md:flex-none md:items-start lg:ml-40">
                <SparklesText className="sm:text-8xl lg:text-9xl -ml-[0.4rem] animate-fade-in" sparklesCount={5}>Omni</SparklesText>
                <div className="sm:text-3xl md:text-4xl font-bold flex gap-2">
                  <FlipText className="text-purple-500">Fast.</FlipText>
                  <FlipText className="text-purple-300">Smart.</FlipText>
                  <FlipText className="text-purple-100">Limitless.</FlipText>
                </div>
                <div className="mt-8 mb-6 animate-fade-in">
                  Unlock the power of AI models — Omni connects you with cutting-edge agents to supercharge your workflows, automate tasks, and amplify your creativity. Fast, smart, limitless. Your AI assistant, reimagined.
                </div>
                <div className="sm:flex sm:justify-center lg:flex-none lg:justify-start">
                  <button
                    className="buttonEffects !bg-launch p-3 flex gap-2 items-center rounded-lg animate-fade-in"
                    id="launch"
                    onClick={() => {
                      router.push("/pages/home");
                    }}
                  >
                    <FontAwesomeIcon icon={faRocket} id="rocket" />
                    Launch App
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div ref={robotRef} className= {`md:w-1/2 flex justify-center item-start transition-opacity duration-1000 ease-in ${robotInView ? 'opacity-100' : 'opacity-0'}`}>
              <DotLottieReact
                src="https://lottie.host/bd5cdb29-22ca-4570-9be6-8bf14baced57/gf7DNNCIz5.lottie"
                autoplay
                loop
                className="w-[400px] h-[250px] md:w-[500px] md:h-[350px] flex-shrink-0"
              />
            </div>
          </div>

          {/* Amount of Users Section */}
          <div ref={userCountRef} className="w-full flex flex-col lg:flex-row items-center justify-center gap-8 md:gap-16 px-4 py-16">
            <div className={`lg:w-5/12 transition-opacity duration-1000 ease-in ${userCountInView ? 'opacity-100' : 'opacity-0'}`}>
              <DotLottieReact
                src="https://lottie.host/a86367a7-40a0-4610-852e-0529f33a6665/HhwVsdInam.lottie"
                autoplay
                loop
                className="w-full max-w-[700px] mx-auto"
              />
            </div>

            <div className={`lg:w-6/12 text-center lg:text-left`}>
              <h3 className={`text-6xl md:text-8xl font-bold transition-opacity duration-700 ease-in ${userCountInView ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600">
                  {userCountInView && <CountUp end={100} duration={2.5} suffix="+" />}
                </span>
              </h3>

              <p className={`mt-4 text-2xl md:text-3xl font-semibold text-gray-200 transition-all duration-700 ease-in-out delay-200 ${userCountInView ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'}`}>
                Pioneers Building the Future.
              </p>

              <p className={`mt-3 text-lg md:text-xl text-gray-400 transition-all duration-700 ease-in-out delay-500 ${userCountInView ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'}`}>
                Our early adopters are already unlocking a smarter way to work with Omni's unified AI. They answer complex questions, generate stunning visuals, and tailor professional resumes—all faster than ever before.
              </p>
            </div>
          </div>

          {/* --- Unified AI Core Section  --- */}
          <div ref={coreRef} className="w-full flex flex-col items-center pt-10 pb-16 px-4">
            <h2 className={`text-4xl font-bold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white transition-opacity duration-1000 ease-in ${coreInView ? 'opacity-100' : 'opacity-0'}`}>
              One Interface. Many Minds.
            </h2>
            <div className={`
              w-full max-w-6xl p-3 rounded-2xl bg-black/30 border border-purple-500/30
              shadow-[0_0_25px_3px_rgba(168,85,247,0.25)]
              transition-all duration-1000 ease-in-out
              ${coreInView ? 'opacity-100 transform-none' : 'opacity-0 translate-y-10'}
            `}>
              <Beam />
            </div>
          </div>

          {/* --- Testimonies Section  --- */}
          <div ref={testimoniesRef} className="w-full flex flex-col items-center mb-20 py-10 px-4">
            <h2 className={`text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white transition-opacity duration-1000 ease-in ${testimoniesInView ? 'opacity-100' : 'opacity-0'}`}>
              Testimonials
            </h2>
            <div className={`flex items-center gap-1 mb-10 transition-all delay-200 duration-1000 ease-in-out ${testimoniesInView ? 'opacity-100 transform-none' : 'opacity-0 translate-y-10'}`}>
              <FaStar className="size-6 text-yellow-400" />
              <FaStar className="size-6 text-yellow-400" />
              <FaStar className="size-6 text-yellow-400" />
              <FaStar className="size-6 text-yellow-400" />
              <FaStar className="size-6 text-yellow-400" />
            </div>
              <div className={`w-full px-4 sm:px-8 md:px-20 lg:px-40 transition-opacity delay-300 duration-1000 ease-in ${testimoniesInView ? 'opacity-100' : 'opacity-0'}`}>
              <MarqueeDemo />
            </div>
          </div>

          {/* --- Footer Section --- */}
          <footer className="w-full flex flex-col sm:flex-row justify-center sm:justify-between items-center gap-4 sm:gap-0 py-5 px-10 border-t border-white/10 mt-auto bg-black/20">
            <p className="text-sm font-medium text-gray-400">© 2025 Omni | All Rights Reserved</p>
            <a
              href="https://github.com/ryan1337c" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300"
            >
              <p className="text-sm font-medium ">Created by Ryan Chen</p> 
              <FaGithub className="size-5" />
            </a>
          </footer>
        </>
      )}
    </div>
  );
}
