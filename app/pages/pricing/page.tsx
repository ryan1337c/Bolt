"use client";
import React, { useEffect, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import Header from '@/app/components/Header';
import { useTheme } from "next-themes";

export default function PricingPage() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted && (
        <>
          <Header />
          <div className={`flex flex-col min-h-screen ${theme === 'dark' ? 'text-white bg-landingPage' : 'text-black bg-landingPageLight'} animate-fade-in`}>
            <div className="flex-grow flex flex-col items-center justify-center p-6 pt-28">
              {/* --- Page Header (Theme-Aware) --- */}
              <div className="text-center mb-16">
                <h1 className={`text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500 mb-4 ${theme === 'dark' ? 'from-purple-400 to-white' : 'from-violet-600 to-pink-500'}`}>
                  Find the Perfect Plan
                </h1>
                <p className={`text-lg max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-slate-600'}`}>
                  Start for free and scale up as you grow. Omni offers flexible pricing to meet the needs of every user, from individuals to large enterprises.
                </p>
              </div>

              {/* --- Pricing Tiers Container --- */}
              <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Tier 1: Free (Theme-Aware) */}
                <div className={`backdrop-blur-sm border rounded-xl shadow-lg p-8 flex flex-col transition-transform duration-300 hover:scale-105 ${theme === 'dark' ? 'bg-slate-900/50 border-purple-500/30' : 'bg-white/60 border-violet-200'}`}>
                  <div className="flex-grow">
                    <h2 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-purple-400' : 'text-violet-600'}`}>Free</h2>
                    <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>For individuals getting started with AI.</p>
                    
                    <div className="text-4xl font-extrabold mb-6">
                      $0 <span className={`text-xl font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>/ month</span>
                    </div>

                    <ul className={`space-y-4 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Access to Basic AI Models</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>10 AI Generations per Day</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Standard Customer Support</span>
                      </li>
                    </ul>
                  </div>
                  <button className={`mt-8 w-full py-3 px-6 text-white font-semibold rounded-lg transition-colors duration-300 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-violet-600 hover:bg-violet-700'}`}>
                    Get Started for Free
                  </button>
                </div>

                {/* Tier 2: Pro (Most Popular, Theme-Aware) */}
                <div className={`backdrop-blur-sm border rounded-xl shadow-lg p-8 flex flex-col transform scale-105 ${theme === 'dark' ? 'bg-slate-900/50 border-purple-500' : 'bg-white/60 border-violet-400'}`}>
                  <div className="relative -top-12 -right-8 self-end">
                    <div className={`text-white text-sm font-bold px-4 py-1 rounded-full shadow-md ${theme === 'dark' ? 'bg-purple-600' : 'bg-violet-600'}`}>
                      Most Popular
                    </div>
                  </div>
                  <div className="flex-grow -mt-4">
                    <h2 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-purple-300' : 'text-fuchsia-500'}`}>Pro</h2>
                    <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>For professionals who need more power.</p>
                    
                    <div className="text-4xl font-extrabold mb-6">
                      TBD
                    </div>

                    <ul className={`space-y-4 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>All Free Tier Perks</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Access to Advanced AI Models</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Unlimited Generations</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Priority Support</span>
                      </li>
                    </ul>
                  </div>
                  <button className={`mt-8 w-full py-3 px-6 font-semibold rounded-lg transition-colors duration-300 ${theme === 'dark' ? 'bg-white hover:bg-gray-200 text-black' : 'bg-slate-900 hover:bg-slate-700 text-white'}`}>
                    Coming Soon
                  </button>
                </div>

                {/* Tier 3: Enterprise (Theme-Aware) */}
                <div className={`backdrop-blur-sm border rounded-xl shadow-lg p-8 flex flex-col transition-transform duration-300 hover:scale-105 ${theme === 'dark' ? 'bg-slate-900/50 border-purple-500/30' : 'bg-white/60 border-violet-200'}`}>
                  <div className="flex-grow">
                    <h2 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-purple-200' : 'text-pink-500'}`}>Enterprise</h2>
                    <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>For businesses requiring enterprise-grade features.</p>

                    <div className="text-4xl font-extrabold mb-6">
                      TBD
                    </div>

                    <ul className={`space-y-4 ${theme === 'dark' ? 'text-gray-300' : 'text-slate-700'}`}>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>All Pro Tier Perks</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Custom Model Integrations</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Dedicated Account Manager</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <FaCheckCircle className="text-green-500" />
                        <span>Team Collaboration Tools</span>
                      </li>
                    </ul>
                  </div>
                  <button className={`mt-8 w-full py-3 px-6 font-semibold rounded-lg transition-colors duration-300 ${theme === 'dark' ? 'bg-white hover:bg-gray-200 text-black' : 'bg-slate-900 hover:bg-slate-700 text-white'}`}>
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}