"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthServices } from '@/lib/authServices';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { FaBolt, FaUserCircle} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { faArrowRightToBracket, faUserPlus, faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ShimmerButton } from "@/components/ui/shimmer-button"

const Header = () => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [profileMenuRef, mobileMenuRef])

  const handleLogout = async () => {
    const auth = new AuthServices();
    await auth.logout();
    setIsMenuOpen(false);
    router.push('/');
    router.refresh();
  };
  
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-landingPageLight text-black dark:bg-[#1e2b3b] dark:text-gray-300 shadow-lg animate-fade-in">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">

        <div className="flex-1 flex justify-start">
          <Link href="/" onClick={closeMenu}>
            <div className="flex items-center gap-3 cursor-pointer">
              <div className='bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full shadow-lg p-2'>
                <FaBolt color='white'/>
              </div>
              <span className="text-2xl font-bold ">Omni</span>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 justify-center items-center gap-8">
          <Link href="/pages/pricing">
            <div className="transition-colors duration-300 font-medium hover:text-violet-600 dark:hover:text-white">Pricing</div>
          </Link>
          <Link href="/pages/contact">
            <div className="transition-colors duration-300 font-medium hover:text-violet-600 dark:hover:text-white">Contact</div>
          </Link>
        </nav>

        <div className="flex-1 flex justify-end items-center">
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <div className="relative group" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="m-1 rounded-full hover:ring-4 transition-all text-slate-600 hover:ring-violet-400/40 dark:text-gray-300 dark:hover:ring-gray-400/30"
                  aria-label="Open profile menu"
                >
                  <FaUserCircle size={35} />
                </button>

                {!isProfileOpen && (
                  <div className="absolute top-full right-0 mt-1 w-max text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 group-hover:delay-500 pointer-events-none bg-white text-slate-700 dark:bg-slate-800 dark:text-white">
                    Open profile menu 
                    <div className="absolute bottom-full right-4 w-0 h-0 border-x-4 border-x-transparent border-b-4 border-b-white dark:border-b-slate-800"></div>
                  </div>
                )}
            
                <div className={`
                  absolute top-full right-0 mt-3 w-64 border rounded-lg shadow-xl p-2
                  flex flex-col gap-1 transition-all duration-300 ease-out origin-top-right 
                  ${isProfileOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
                  bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700
                `}>
                  <ThemeToggle />
                  <hr className="my-1 border-slate-200 dark:border-slate-700" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 text-left px-4 py-2 text-sm rounded-md transition-colors text-slate-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-slate-700"
                  >
                    <FontAwesomeIcon icon={faArrowRightFromBracket} />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
            <div className="flex items-center gap-4">
              <Link href="/pages/login">
                <ShimmerButton
                  background="var(--login-bg)"
                  shimmerColor="var(--login-shimmer)"
                  shimmerSize='0.1em'
                  className="p-2 flex gap-2 items-center font-semibold text-white rounded-lg [--login-bg:#7c3aed] [--login-shimmer:#e9d5ff] dark:[--login-bg:#1e293b] dark:[--login-shimmer:#a78bfa]"
                >
                  <FontAwesomeIcon icon={faArrowRightToBracket} />
                  Log In
                </ShimmerButton>
              </Link>

              <Link href="/pages/register">
                <ShimmerButton
                  background="var(--reg-bg)" 
                  shimmerColor="var(--reg-shimmer)"
                  shimmerSize='0.1em'
                  className="p-2 flex gap-2 items-center font-semibold rounded-lg text-violet-600 dark:text-gray-300 [--reg-bg:#ffffff] [--reg-shimmer:#c4b5fd] dark:[--reg-bg:#334155] dark:[--reg-shimmer:#a78bfa]"
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  Sign Up
                </ShimmerButton>
              </Link>
            </div>
        )}
          </div>
          
        <div className='relative md:hidden' ref={mobileMenuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className={`
            md:hidden absolute top-full w-64 p-3 right-0 flex flex-col border
            rounded-lg shadow-xl transition-all duration-300 ease-out origin-top-right text-sm
            ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 pointer-events-none scale-95'}
            bg-white border-slate-200 dark:bg-gray-900 dark:border-slate-700
          `}>
              <Link href="/pages/pricing" onClick={closeMenu}>
                <div className="text-left font-semibold w-full px-4 py-3 rounded-md transition-colors duration-200 text-slate-700 hover:bg-slate-100 hover:text-violet-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-700/50">
                  Pricing
                </div>
              </Link>
              <Link href="/pages/contact" onClick={closeMenu}>
                <div className="text-left font-semibold w-full px-4 py-3 rounded-md transition-colors duration-200 text-slate-700 hover:bg-slate-100 hover:text-violet-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-700/50">
                  Contact
                </div>
              </Link>
              <hr className="my-2 border-slate-200 dark:border-slate-700" />
              {isLoggedIn ? (
                  <> 
                    <ThemeToggle />
                    <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 text-left px-4 py-2 rounded-md transition-colors text-slate-700 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-slate-700/50"
                  >
                    <FontAwesomeIcon icon={faArrowRightFromBracket} />
                    Sign Out
                  </button>
                  </>
                ) : (
                <div className="flex flex-col gap-1">
                  <Link href="/pages/login" onClick={closeMenu}>
                    <button className="w-full flex items-center justify-start gap-3 px-4 py-2 rounded-md transition-colors font-semibold text-slate-700 hover:bg-slate-100 hover:text-violet-700 dark:text-gray-300 dark:hover:bg-slate-700/50">
                      <FontAwesomeIcon icon={faArrowRightToBracket} />
                      Log In
                    </button>
                  </Link>
                  <Link href="/pages/register" onClick={closeMenu}>
                    <button className="w-full flex items-center justify-start gap-3 px-4 py-2 rounded-md transition-colors font-semibold text-slate-700 hover:bg-slate-100 hover:text-violet-700 dark:text-gray-300 dark:hover:bg-slate-700/50">
                      <FontAwesomeIcon icon={faUserPlus} />
                      Sign Up
                    </button>
                  </Link>
                </div>
              )}
          </div>
        </div>
        </div>
      </div>
    </header>
  );
}

export default Header;