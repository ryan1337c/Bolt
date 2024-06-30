import React from 'react'
import { FaRobot } from "react-icons/fa";
import Link from 'next/link';

const Header = () => {
  return (
    <div className=" flex  text-white justify-between">
      <div className="p-5 flex gap-2 text-xl font-bold items-center" >
      <FaRobot />
      ImageAI
      </div>

    <Link href={`/`}>  
            <button className=" mr-6 p-2 inline-block buttonEffects hover:bg-hoverLandingPage">Sign Out</button>
      </Link> 
    </div>
  )
}

export default Header;