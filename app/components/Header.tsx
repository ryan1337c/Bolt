import React, {useEffect, useState} from 'react'
import { FaRobot } from "react-icons/fa";
import { AuthServices } from '@/lib/authServices';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';

const Header = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div className=" h-[16] flex  text-white justify-between">
      <button className="p-5 flex gap-2 text-xl font-bold items-center" onClick={() => {
        router.push('/');
      }}>
      <FaRobot />
      Bolt
      </button>
      {mounted && <button className=" m-5 p-2 flex gap-2 items-center buttonEffects hover:bg-hoverLandingPage" onClick={async () => {
        const auth = new AuthServices();
        await auth.logout();
        // redirect back to landing page 
        router.push('/');
      }}>
        <FontAwesomeIcon icon={faArrowRightFromBracket}/>
        Sign Out</button>}

    </div>
  )
}

export default Header;