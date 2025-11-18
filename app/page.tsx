"use client"
import { useAuth } from './context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState, useRef} from 'react';
import { useRouter } from 'next/navigation';
import { SparklesText } from "@/components/magicui/sparkles-text";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { FlipText } from "@/components/magicui/flip-text";
import { Beam } from '@/components/magicui/beam';
import { useInView } from 'react-intersection-observer';
import { MarqueeDemo } from '@/components/magicui/review-cards';
import { FaStar, FaGithub, FaPlay} from 'react-icons/fa';
import { BsChatDots, BsCpu, BsFileText, BsImage, BsUpload, BsCodeSlash } from 'react-icons/bs';
import CountUp from 'react-countup';
import Header from './components/Header';
import { useTheme } from "next-themes";
import { RainbowButton } from "@/components/ui/rainbow-button"
import FeatureCard from '@/components/ui/FeatureCard';
import { Feature } from '@/components/types/types';


export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayVideo = () => {
    if (videoRef.current) {
        videoRef.current.play();
        setIsPlaying(true);
    }
  };

  const features: Feature[] = [
    {
      icon: BsChatDots,
      title: 'General Chatting',
      description: 'Engage in natural, intelligent conversations for answers, ideas, and creative collaboration.',
    },
    {
      icon: BsCpu,
      title: 'LLM Model Selection',
      description: 'Switch between a variety of powerful large language models to find the perfect mind for your specific task.',
    },
    {
      icon: BsFileText,
      title: 'Resume Tailor',
      description: 'Optimize your resume for any job application by letting our AI tailor it to match the job description perfectly.',
    },
    {
      icon: BsImage,
      title: 'Image Generation',
      description: 'Bring your ideas to life. Generate stunning, high-quality images from simple text descriptions in seconds.',
    },
    {
      icon: BsUpload,
      title: 'File Upload & Process',
      description: 'Securely upload documents and files for the AI to analyze, summarize, or transform based on your needs.',
    },
    {
      icon: BsCodeSlash,
      title: 'Vibe Coding',
      description: 'Code in real-time with an AI partner that suggests solutions and helps you squash bugs before they happen.',
    }
  ];

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

  // Observer for the Feature section
  const { ref: featuresRef, inView: featuresInView } = useInView({ 
    triggerOnce: true, 
    threshold: 0.2 
  });

  const { ref: heroVideoRef, inView: heroVideoInView } = useInView({ 
    threshold: 0.2 
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // If the video is not in view and it was playing, reset it.
    if (!heroVideoInView && isPlaying) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.load();
        setIsPlaying(false);
      }
    }
  }, [heroVideoInView, isPlaying]);

  return (
    <>
      {mounted && (
        <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'text-white bg-landingPage' : 'text-black bg-landingPageLight'}  overflow-hidden`}>
          <Header />
          <div className="flex flex-col items-center lg:flex-row px-4 pt-10 " >
            {/* Left Side */}
            <div className="md:w-1/2 mt-16 min-h-[45vh]">
              <div className="flex flex-col items-center md:flex-none md:items-start lg:ml-40">
                <SparklesText className="sm:text-8xl lg:text-9xl -ml-[0.4rem] animate-fade-in " sparklesCount={5}>Omni</SparklesText>
                <div className="sm:text-3xl md:text-4xl font-bold flex gap-2">
                  <FlipText className={`${theme === 'dark' ? 'text-purple-500' : 'text-violet-600'}`}>Fast.</FlipText>
                  <FlipText className={`${theme === 'dark' ? 'text-purple-300': 'text-fuchsia-500'}`}>Smart.</FlipText>
                  <FlipText className={`${theme === 'dark' ? 'text-purple-100' : 'text-pink-500'}`}>Limitless.</FlipText>
                </div>
                <div className="mt-8 mb-6 animate-fade-in">
                  Unlock the power of AI models — Omni connects you with cutting-edge agents to supercharge your workflows, automate tasks, and amplify your creativity. Fast, smart, limitless. Your AI assistant, reimagined.
                </div>
                <div className="sm:flex sm:justify-center lg:flex-none lg:justify-start animate-fade-in">
                  <RainbowButton
                    className={`p-5 flex gap-2 items-center rounded-lg ${theme === 'dark' ? 'bg-launch' : 'bg-landingPageLight'}`}
                    id="launch"
                    onClick={() => {
                      router.push("/pages/home");
                    }}
                    variant={'outline'}
                    size={"lg"}
                    >
                    <FontAwesomeIcon icon={faRocket} id="rocket" />
                    Launch App 
                  </RainbowButton>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div ref={robotRef} className= {`hidden md:w-1/2 lg:flex justify-center item-start transition-opacity duration-1000 ease-in ${robotInView ? 'opacity-100' : 'opacity-0'}`}>
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
                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme === 'dark' ? 'from-purple-400 to-purple-600' : 'from-violet-600 to-pink-500'}`}>
                  {userCountInView && <CountUp end={100} duration={2.5} suffix="+" />}
                </span>
              </h3>

              <p className={`mt-4 text-2xl md:text-3xl font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-black'} transition-all duration-700 ease-in-out delay-200 ${userCountInView ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'}`}>
                Pioneers Building the Future.
              </p>

              <p className={`mt-3 text-lg md:text-xl  ${theme === 'dark' ? 'text-gray-400' : 'text-black'}  transition-all duration-700 ease-in-out delay-500 ${userCountInView ? 'opacity-100 transform-none' : 'opacity-0 translate-y-4'}`}>
                Our early adopters are already unlocking a smarter way to work with Omni&apos;s unified AI. They answer complex questions, generate stunning visuals, and tailor professional resumes—all faster than ever before.
              </p>
            </div>
          </div>

            {/* --- Hero Video Section --- */}
            <section ref={heroVideoRef} className="w-full flex flex-col items-center py-16 px-4">
              <h2 className={`text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r ${theme === 'dark' ? 'from-purple-400 to-white' : 'from-violet-600 to-pink-500'} transition-opacity duration-1000 ease-in ${heroVideoInView ? 'opacity-100' : 'opacity-0'}`}>
                See Omni in Action
              </h2>
              <p className={`text-lg text-center max-w-2xl mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} transition-opacity duration-1000 ease-in delay-200 ${heroVideoInView ? 'opacity-100' : 'opacity-0'}`}>
                A glimpse into the future of productivity and creative workflows.
              </p>
              <div className={`w-full max-w-5xl rounded-2xl overflow-hidden transition-all duration-1000 ease-in-out ${heroVideoInView ? 'opacity-100 transform-none' : 'opacity-0 translate-y-10'}
                  ${theme === 'dark' ? 'shadow-[0_0_35px_5px_rgba(168,85,247,0.2)]' : 'shadow-[0_0_35px_5px_rgba(139,92,246,0.2)]'}
              `}>
                <div className="relative w-full aspect-video">
                  {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30 cursor-pointer" onClick={handlePlayVideo}>
                          <button
                              className="p-5 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                              aria-label="Play video"
                          >
                              <FaPlay className="w-8 h-8 ml-1" />
                          </button>
                      </div>
                  )}
                  <video
                    ref={videoRef}
                    src="OmniDemoHero.mp4"
                    poster="omniDemoPoster.png"
                    muted
                    playsInline
                    controls={isPlaying}
                    onEnded={() => setIsPlaying(false)}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </section>
          
            {/* --- Features Section --- */}
            <section ref={featuresRef} className="w-full flex flex-col items-center pt-20 pb-24 px-4">
              <h2 className={`text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r ${theme === 'dark' ? 'from-purple-400 to-white' : 'from-violet-600 to-pink-500'} transition-opacity duration-1000 ease-in ${featuresInView ? 'opacity-100' : 'opacity-0'}`}>
                Discover What&apos;s Possible
              </h2>
               <p className={`text-lg text-center max-w-2xl mb-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} transition-opacity duration-1000 ease-in delay-200 ${featuresInView ? 'opacity-100' : 'opacity-0'}`}>
                Omni is more than just a chatbot. It&apos;s a suite of powerful, interconnected AI tools designed to amplify your productivity and creativity.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
                {features.map((feature, index) => (
                  <FeatureCard 
                    key={index} 
                    feature={feature} 
                    inView={featuresInView}
                    index={index}
                  />
                ))}
              </div>
            </section>

          {/* --- Unified AI Core Section  --- */}
          <div ref={coreRef} className="w-full flex flex-col items-center pt-10 pb-16 px-4">
            <h2 className={`text-4xl font-bold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r ${theme === 'dark' ? 'from-purple-400 to-white' : 'from-violet-600 to-pink-500'}   transition-opacity duration-1000 ease-in ${coreInView ? 'opacity-100' : 'opacity-0'}`}>
              One Interface. Many Minds.
            </h2>
            <div className={`
              w-full max-w-6xl p-3 rounded-2xl
              ${theme === 'dark' ? "bg-black/30 border-purple-500/30 shadow-[0_0_25px_3px_rgba(168,85,247,0.25)]" : "bg-white/50 border border-violet-300 shadow-[0_0_25px_3px_rgba(139,92,246,0.25)]"}
              transition-all duration-1000 ease-in-out
              ${coreInView ? 'opacity-100 transform-none' : 'opacity-0 translate-y-10'}
            `}>
              <Beam />
            </div>
          </div>

          {/* --- Testimonies Section  --- */}
          <div ref={testimoniesRef} className="w-full flex flex-col items-center mb-20 py-10 px-4">
            <h2 className={`text-4xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r ${theme === 'dark' ? "from-purple-400 to-white" : "from-violet-600 to-pink-500"} transition-opacity duration-1000 ease-in ${testimoniesInView ? 'opacity-100' : 'opacity-0'}`}>
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
          <footer className={`
            w-full flex flex-col sm:flex-row justify-center sm:justify-between items-center 
            gap-4 sm:gap-0 py-5 px-10 mt-auto 
            border-t ${theme === 'dark' ? 'bg-black/20 border-white/10' : 'bg-white/50 border-black/10'} 
            
          `}>
            <p className={`text-sm font-medium ${theme === 'dark' ? "text-gray-400" : "text-slate-600" }`}>
              © 2025 Omni | All Rights Reserved
            </p>
            <a
              href="https://github.com/ryan1337c" 
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 ${theme === 'dark' ? "text-gray-400 hover:text-white" : "text-slate-600 hover:text-black"}  transition-colors duration-300`}
            >
              <p className="text-sm font-medium">Created by Ryan Chen</p> 
              <FaGithub className="size-5" />
            </a>
          </footer>
        </div>
      )}
    </>
  );
}
