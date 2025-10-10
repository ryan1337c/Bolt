"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthServices } from '@/lib/authServices';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { FaBolt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { faArrowRightToBracket, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    const auth = new AuthServices();
    await auth.logout();
    setIsMenuOpen(false); // Close menu on logout
    router.push('/');
    router.refresh();
  };
  
  // A helper function to close the menu, useful for links
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className='fixed top-0 left-0 w-full z-50 bg-[#1e2b3b] shadow-lg animate-fade-in'>
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">

        {/* LEFT COLUMN */}
        <div className="flex-1 flex justify-start">
          <Link href="/" onClick={closeMenu}>
            <div className="flex items-center gap-3 cursor-pointer">
              <div className='bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full shadow-lg p-2'>
                <FaBolt color='white'/>
              </div>
              <span className="text-2xl font-bold text-white">Omni</span>
            </div>
          </Link>
        </div>

        {/* CENTER COLUMN (Desktop Navigation) */}
        <nav className="hidden md:flex flex-1 justify-center items-center gap-8">
          <Link href="/pages/pricing">
            <div className="text-gray-300 hover:text-white transition-colors duration-300 font-medium">Pricing</div>
          </Link>
          <Link href="/pages/contact">
            <div className="text-gray-300 hover:text-white transition-colors duration-300 font-medium">Contact</div>
          </Link>
        </nav>

        {/*  RIGHT COLUMN (Desktop Auth & Mobile Menu Button) */}
        <div className="flex-1 flex justify-end items-center">
          {/* Desktop Auth Buttons: Hidden on mobile */}
          <div className="hidden md:flex items-center gap-4 text-white">
            {isLoggedIn ? (
              <button
                className="p-2 inline-block buttonEffects hover:bg-hoverLandingPage"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/pages/login">
                  <button className="p-2 flex gap-2 items-center buttonEffects hover:bg-hoverLandingPage">
                    <FontAwesomeIcon icon={faArrowRightToBracket} />
                    Log In
                  </button>
                </Link>
                <Link href="/pages/register">
                  <button className="p-2 flex gap-2 items-center buttonEffects hover:bg-hoverLandingPage">
                    <FontAwesomeIcon icon={faUserPlus} />
                    Sign Up
                  </button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile Hamburger Button: Hidden on desktop */}
          <div className='relative md:hidden'>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu />}
            </button>
            
            <div className={`md:hidden absolute top-full w-64 p-3 bg-gray-900 right-0 transition-all duration-300 ease-in-out flex flex-col 
              border border-slate-700 rounded-lg shadow-xl
               ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <Link href="/pages/pricing" onClick={closeMenu}>
                  <div className='text-gray-300 hover:text-purple-300 hover:bg-slate-700/50 text-left font-semibold w-full px-4 py-3 rounded-md transition-colors duration-200'>
                    Pricing
                  </div>
                </Link>
                <Link href="/pages/contact" onClick={closeMenu}>
                  <div className='text-gray-300 hover:text-purple-300 hover:bg-slate-700/50 text-left font-semibold w-full px-4 py-3 rounded-md transition-colors duration-200'>
                    Contact
                  </div>
                </Link>
                <hr className="border-slate-700 my-2" />
                {isLoggedIn ? (
                  <button
                    className="p-2 inline-block buttonEffects hover:bg-slate-700"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                  ) : (
                  <div className="flex flex-col justify-center text-white">
                    <Link href="/pages/login">
                      <button className="px-4 py-2 flex gap-3 items-center buttonEffects w-full rounded-md hover:text-purple-300 transition-colors duration-200">
                        <FontAwesomeIcon icon={faArrowRightToBracket} />
                        Log In
                      </button>
                    </Link>
                    <Link href="/pages/register">
                      <button className="px-4 py-2 flex gap-3 items-center buttonEffects w-full rounded-md hover:text-purple-300 transition-colors duration-200">
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