"use client"
import Link from 'next/link';
import IconRobot from './IconRobot';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen text-white">
      <div className="ml-auto gap-5 ">      
            <Link href={`./Pages/Login`}>  
            <button className="p-2 inline-block buttonEffects hover:bg-hoverLandingPage">Log In</button>
            </Link> 
            <button className="p-2 ml-3 inline-block buttonEffects hover:bg-hoverLandingPage">Sign Up</button>
      </div>
        <div className="mt-[100px] flex flex-col justify-center items-center ">
          <div className="text-center text-9xl font-bol m-5 title">ImageAI</div>
          <div className="text-center text-xl mt-10 subTitle">Recreate Your Imagination With the Power of AI</div>
          <IconRobot width="300px" height="auto" className="m-10"/>
        </div>
    </div>
)
}
