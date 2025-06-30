"use client"
import Link from 'next/link';
import IconRobot from './IconRobot';
import { useAuth } from './context/AuthContext';
import { AuthServices } from '@/lib/authServices';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightToBracket, faUserPlus, faRocket} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';


export default function Home() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

  const { isLoggedIn } = useAuth();

  return (
    <div className="flex flex-col min-h-screen text-white">
      {mounted && <><div className="ml-auto ">
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
      <div className="flex flex-col justify-center items-center  mt-[70px]">
        <div className="text-center text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold m-5 title">
          ImageAI
        </div>
          <div className="text-center text-xl mt-10 subTitle">Recreate Your Imagination With the Power of AI</div>
          <IconRobot 
            className="m-10 mb-5 w-[50vw] h-[25vh] sm:w-[40vw] sm:h-[30vh] md:w-[30vw] md:h-[35vh] lg:w-[25vw] lg:h-[40vh]" 
          />
          
          <button className=" buttonEffects !bg-launch p-3 flex gap-2 items-center rounded-lg" id="launch" onClick={() => {
            router.push("/pages/home")
          }}>
            <FontAwesomeIcon icon={faRocket} id="rocket"/>
            Launch App
          </button>
      </div></>}
    </div>
)


}
