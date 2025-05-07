"use client"
import Link from 'next/link';
import IconRobot from './IconRobot';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen text-white">
      <div className="ml-auto ">      
            <Link href={`./Pages/Login`}>  
            <button className="p-2 inline-block buttonEffects hover:bg-hoverLandingPage">Log In</button>
            </Link> 
            <Link href={`./Pages/Register`}>
            <button className="p-2 ml-3 inline-block buttonEffects hover:bg-hoverLandingPage">Sign Up</button>
            </Link>
      </div>
      <div className="flex flex-col justify-center items-center  mt-[70px]">
        <div className="text-center text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold m-5 title">
          ImageAI
        </div>
          <div className="text-center text-xl mt-10 subTitle">Recreate Your Imagination With the Power of AI</div>
          <IconRobot 
            className="m-10 w-[50vw] h-[25vh] sm:w-[40vw] sm:h-[30vh] md:w-[30vw] md:h-[35vh] lg:w-[25vw] lg:h-[40vh]" 
          />
      </div>
    </div>
)
}
