"use client";
import React, { useEffect, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import Header from '@/app/components/Header';

export default function PricingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted && (
        <>
          <Header />
          {/* Set the main background color here */}
          <div className="flex flex-col min-h-screen text-white animate-fade-in">
            <div className="flex-grow flex flex-col items-center justify-center p-6 pt-28"> {/* Added top padding */}
              {/* --- Page Header --- */}
              <div className="text-center mb-16">
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white mb-4">
                  Find the Perfect Plan
                </h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                  Start for free and scale up as you grow. Omni offers flexible pricing to meet the needs of every user, from individuals to large enterprises.
                </p>
              </div>

              {/* --- Pricing Tiers Container --- */}
              <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Tier 1: Free */}
                <div className="bg-slate-900/50 rounded-xl shadow-lg border border-purple-500/30 p-8 flex flex-col transition-transform duration-300 hover:scale-105">
                  <div className="flex-grow">
                    <h2 className="text-3xl font-bold text-purple-400 mb-2">Free</h2>
                    <p className="text-gray-400 mb-6">For individuals getting started with AI.</p>
                    
                    <div className="text-4xl font-extrabold mb-6">
                      $0 <span className="text-xl font-medium text-gray-400">/ month</span>
                    </div>

                    <ul className="space-y-4 text-gray-300">
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
                  <button className="mt-8 w-full py-3 px-6 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors duration-300">
                    Get Started for Free
                  </button>
                </div>

                {/* Tier 2: Pro (Most Popular) */}
                <div className="bg-slate-900/50 rounded-xl shadow-lg border border-purple-500 p-8 flex flex-col transform scale-105">
                  <div className="relative -top-12 -right-8 self-end">
                    <div className="bg-purple-600 text-white text-sm font-bold px-4 py-1 rounded-full shadow-md">
                      Most Popular
                    </div>
                  </div>
                  <div className="flex-grow -mt-4">
                    <h2 className="text-3xl font-bold text-purple-300 mb-2">Pro</h2>
                    <p className="text-gray-400 mb-6">For professionals who need more power.</p>
                    
                    <div className="text-4xl font-extrabold mb-6">
                      TBD
                    </div>

                    <ul className="space-y-4 text-gray-300">
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
                  <button className="mt-8 w-full py-3 px-6 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-300">
                    Coming Soon
                  </button>
                </div>

                {/* Tier 3: Enterprise */}
                <div className="bg-slate-900/50 rounded-xl shadow-lg border border-purple-500/30 p-8 flex flex-col transition-transform duration-300 hover:scale-105">
                  <div className="flex-grow">
                    <h2 className="text-3xl font-bold text-purple-200 mb-2">Enterprise</h2>
                    <p className="text-gray-400 mb-6">For businesses requiring enterprise-grade features.</p>

                    <div className="text-4xl font-extrabold mb-6">
                      TBD
                    </div>

                    <ul className="space-y-4 text-gray-300">
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
                  <button className="mt-8 w-full py-3 px-6 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors duration-300">
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