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
import { useTheme } from "next-themes";
import { ShimmerButton } from "@/components/ui/shimmer-button"

const Header = () => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (theme === 'dark') {
      console.log("We are in dark mode!");
      // Run any dark-mode specific logic here
    } else {
      console.log("We are in light mode!");
      // Run any light-mode specific logic here
    }
  }, [theme]); // This useEffect will re-run whenever the theme changes

  // Click outside handler to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up to prevent memory leak (duplication)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [profileMenuRef])

  const handleLogout = async () => {
    const auth = new AuthServices();
    await auth.logout();
    setIsMenuOpen(false);
    router.push('/');
    router.refresh();
  };
  
  // A helper function to close the menu, useful for links
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={`fixed top-0 left-0 w-full z-50 ${theme === 'dark' ? 'bg-[#1e2b3b] text-gray-300' : 'bg-landingPageLight text-black'} shadow-lg animate-fade-in`}>
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">

        {/* --- LEFT & CENTER Columns are now theme-aware --- */}
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
            <div className="  hover:text-violet-600 hover:dark:text-white transition-colors duration-300 font-medium">Pricing</div>
          </Link>
          <Link href="/pages/contact">
            <div className=" hover:text-violet-600 dark:hover:text-white transition-colors duration-300 font-medium">Contact</div>
          </Link>
        </nav>

        {/* --- RIGHT COLUMN --- */}
        <div className="flex-1 flex justify-end items-center">
          {/* --- Desktop Auth Buttons --- */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <div className="relative group" ref={profileMenuRef}>
              {/* Profile Icon Button */}
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`
                  m-1 rounded-full 
                  text-slate-600 hover:ring-4 hover:ring-violet-400/40
                  dark:text-gray-300 dark:hover:ring-gray-400/30
                  transition-all
                `}
                aria-label="Open profile menu"
              >
                <FaUserCircle size={35} />
              </button>

                {/* Animated Tooltip on Hover */}
                {!isProfileOpen && (
                  <div className={`
                    absolute top-full right-0 mt-1 w-max 
                    bg-white dark:bg-slate-800 text-slate-700 dark:text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg
                    opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100
                    transition-all duration-200 group-hover:delay-500
                    pointer-events-none
                  `}>
                    Open profile menu 
                    <div className="absolute bottom-full right-4 w-0 h-0 
                                    border-x-4 border-x-transparent border-b-4 border-b-white dark:border-b-slate-800"></div>
                  </div>
                )}
            
                {/* Profile Dropdown Panel */}
                <div className={`
                  absolute top-full right-0 mt-3 w-64 
                  bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-2
                  flex flex-col gap-1
                  transition-all duration-300 ease-out
                  origin-top-right 
                  ${isProfileOpen 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-95 pointer-events-none'
                  }
                `}>
                  <ThemeToggle />
                  <hr className="border-slate-200 dark:border-slate-700 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 text-left px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                  >
                    <FontAwesomeIcon icon={faArrowRightFromBracket} />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
            <div className="flex items-center gap-4">
              {/* --- Primary Action: Log In (No changes here) --- */}
              <Link href="/pages/login">
                <ShimmerButton
                  background={theme === 'dark' ? '#1e293b' : '#7c3aed'}
                  shimmerColor={theme === 'dark' ? '#a78bfa' : '#e9d5ff'}
                  shimmerSize='0.1em'
                  className="p-2 flex gap-2 items-center font-semibold text-white rounded-lg"
                >
                  <FontAwesomeIcon icon={faArrowRightToBracket} />
                  Log In
                </ShimmerButton>
              </Link>

              {/* --- Secondary Action: Sign Up (UPDATED) --- */}
              <Link href="/pages/register">
                <ShimmerButton
                  // Use a clean white background in light mode
                  background={theme === 'dark' ? '#334155' : '#ffffff'} 
                  // Adjust shimmer to be visible on the white background
                  shimmerColor={theme === 'dark' ? '#a78bfa' : '#c4b5fd'}
                  shimmerSize='0.1em'
                  className={`
                    p-2 flex gap-2 items-center font-semibold rounded-lg
                    text-violet-600 dark:text-gray-300
                    
                  `}
                >
                  <FontAwesomeIcon icon={faUserPlus} />
                  Sign Up
                </ShimmerButton>
              </Link>
            </div>
        )}
          </div>
          
          {/* --- Mobile Menu (theme-aware) --- */}
        <div className='relative md:hidden'>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className={`
            md:hidden absolute top-full w-64 p-3 right-0 flex flex-col 
            bg-white border border-slate-200
            dark:bg-gray-900 dark:border-slate-700 
            rounded-lg shadow-xl
            transition-all duration-300 ease-out
            origin-top-right 
            text-sm
            ${isMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 pointer-events-none scale-95'}
          `}>
              <Link href="/pages/pricing" onClick={closeMenu}>
                <div className='text-slate-700 hover:bg-slate-100 hover:text-violet-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-700/50 text-left font-semibold w-full px-4 py-3 rounded-md transition-colors duration-200'>
                  Pricing
                </div>
              </Link>
              <Link href="/pages/contact" onClick={closeMenu}>
                <div className='text-slate-700 hover:bg-slate-100 hover:text-violet-700 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-700/50 text-left font-semibold w-full px-4 py-3 rounded-md transition-colors duration-200'>
                  Contact
                </div>
              </Link>
              <hr className="border-slate-200 dark:border-slate-700 my-2" />
              {isLoggedIn ? (
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 text-left px-4 py-2 text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-md transition-colors"
                  >
                    <FontAwesomeIcon icon={faArrowRightFromBracket} />
                    Sign Out
                  </button>
                ) : (
                <div className="flex flex-col gap-1">
                  {/* Primary Action: Log In */}
                  <Link href="/pages/login" onClick={closeMenu}>
                    <button className="w-full flex items-center justify-start gap-3 px-4 py-2 rounded-md transition-colors font-semibold
                                       text-slate-700 hover:bg-slate-100 hover:text-violet-700
                                      dark:text-gray-300 dark:hover:bg-slate-700/50">
                      <FontAwesomeIcon icon={faArrowRightToBracket} />
                      Log In
                    </button>
                  </Link>
                  {/* Secondary Action: Sign Up */}
                  <Link href="/pages/register" onClick={closeMenu}>
                    <button className="w-full flex items-center justify-start gap-3 px-4 py-2 rounded-md transition-colors font-semibold
                                      text-slate-700 hover:bg-slate-100 hover:text-violet-700
                                      dark:text-gray-300 dark:hover:bg-slate-700/50">
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
      {/* <ThemeToggle /> */}
    </header>
  );
}

export default Header;