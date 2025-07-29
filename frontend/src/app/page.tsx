'use client'

import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { FaLock, FaChartLine, FaCode } from "react-icons/fa";
import { RiMoneyDollarCircleFill, RiExchangeDollarFill, RiHandCoinFill } from "react-icons/ri";
import { MdSecurity, MdOutlineVerified, MdOutlinePublic } from "react-icons/md";
import React from 'react';


export default function Home() {

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-b from-secondary to-background relative overflow-hidden">
          {/* Animated background shapes */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Original circles */}
            <div className="absolute top-20 left-10 w-32 h-32 md:w-64 md:h-64 rounded-full bg-accent/10 animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 md:w-80 md:h-80 rounded-full bg-purple-500/10 animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 md:w-48 md:h-48 rounded-full bg-blue-500/10 animate-pulse delay-500"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 md:w-96 md:h-96 rounded-full bg-accent/5 blur-3xl"></div>
            <div className="absolute -top-20 -right-20 w-64 h-64 md:w-96 md:h-96 rounded-full bg-purple-500/5 blur-3xl"></div>
            
            {/* Additional small animated circles */}
            <div className="absolute top-1/3 right-1/4 w-12 h-12 md:w-20 md:h-20 rounded-full bg-green-500/15 animate-float-slow"></div>
            <div className="absolute bottom-1/4 left-1/3 w-10 h-10 md:w-16 md:h-16 rounded-full bg-blue-400/20 animate-float-delay"></div>
            <div className="absolute top-2/3 right-1/3 w-8 h-8 md:w-14 md:h-14 rounded-full bg-yellow-500/15 animate-float"></div>
            <div className="absolute top-40 right-20 w-6 h-6 md:w-10 md:h-10 rounded-full bg-pink-500/20 animate-spin-slow"></div>
            <div className="absolute bottom-32 left-20 w-5 h-5 md:w-8 md:h-8 rounded-full bg-purple-400/25 animate-ping-slow"></div>
            <div className="absolute top-1/2 right-1/2 w-4 h-4 md:w-6 md:h-6 rounded-full bg-indigo-500/20 animate-bounce-slow"></div>
          </div>
          
          <div className="container mx-auto text-center relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white">
              LENDING PROTOCOL FOR RWAs
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-8 sm:mb-12 max-w-3xl mx-auto">
                Seamless and secure lending, borrowing, and yield generation for crypto-native Real World Assets (RWAs) on KiiChain with Cirqa Protocol.
              </p>
            <Link href="/app" className="btn-primary text-base sm:text-lg py-2 sm:py-3 px-6 sm:px-8 bg-accent hover:bg-accent/90 hover:scale-105 transition-all duration-300 inline-flex items-center rounded-lg shadow-lg shadow-accent/20">
              <span>Launch App</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </Link>
          </div>
        </section>
        
        {/* Stats Section */}
        <section className="py-12 sm:py-16 bg-gray-800 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-repeat opacity-10"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 text-center">
              <div className="p-4 sm:p-6 flex flex-col items-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-accent mb-3 sm:mb-4">
                  <RiMoneyDollarCircleFill size={32} className="sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">$12.5M+</h3>
                <p className="text-gray-400 text-sm sm:text-base">Total Value Locked</p>
              </div>
              <div className="p-4 sm:p-6 flex flex-col items-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-accent mb-3 sm:mb-4">
                  <FaChartLine size={32} className="sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">10B</h3>
                <p className="text-gray-400 text-sm sm:text-base">Max CIRQA Supply</p>
              </div>
              <div className="p-4 sm:p-6 flex flex-col items-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-accent mb-3 sm:mb-4">
                  <RiExchangeDollarFill size={32} className="sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">0.158</h3>
                <p className="text-gray-400 text-sm sm:text-base">CIRQA Rewards Per Second</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-b from-background to-secondary relative overflow-hidden">
          {/* Animated shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 md:mb-16">CORE FEATURES</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
              <div className="card p-4 sm:p-6 hover:border-accent transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg hover:shadow-accent/10">
                <div className="text-accent mb-4 sm:mb-6 flex justify-center">
                  <RiHandCoinFill size={36} className="sm:w-12 sm:h-12" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-center">Decentralized Lending and Borrowing</h3>
                <p className="text-gray-400 text-center text-sm sm:text-base">
                  Supply assets to earn interest or borrow against your collateral with transparent terms and competitive rates on the Cirqa Protocol.
                </p>
              </div>
              <div className="card p-4 sm:p-6 hover:border-accent transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg hover:shadow-accent/10">
                <div className="text-accent mb-4 sm:mb-6 flex justify-center">
                  <FaChartLine size={36} className="sm:w-12 sm:h-12" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-center">CIRQA Token Rewards</h3>
                <p className="text-gray-400 text-center text-sm sm:text-base">
                  Earn CIRQA token rewards for supplying and borrowing assets. The protocol distributes rewards based on allocation points and your participation.
                </p>
              </div>
              <div className="card p-4 sm:p-6 hover:border-accent transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg hover:shadow-accent/10">
                <div className="text-accent mb-4 sm:mb-6 flex justify-center">
                  <FaLock size={36} className="sm:w-12 sm:h-12" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-center">Flexible Collateral Options</h3>
                <p className="text-gray-400 text-center text-sm sm:text-base">
                  Choose which assets to use as collateral with our setCollateralStatus feature, giving you complete control over your lending and borrowing strategy.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Security Section */}
        <section className="py-12 sm:py-16 md:py-20 px-4 bg-gray-800 relative">
          {/* Animated security pattern */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/security-pattern.svg')] bg-repeat opacity-5"></div>
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-gray-800 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-gray-800 to-transparent"></div>
          </div>
          
          <div className="container mx-auto text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4">AUDITED AND VERIFIED</h2>
            <p className="text-lg sm:text-xl text-gray-400 mb-8 sm:mb-12 max-w-3xl mx-auto">
              THE MOST SECURE MONEY PROTOCOL
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
              <div className="p-4 sm:p-6 border border-transparent hover:border-accent transition-all duration-300 transform hover:-translate-y-2 rounded-lg bg-gray-800/50 backdrop-blur-sm">
                <div className="text-accent mb-4 sm:mb-6 flex justify-center">
                  <MdSecurity size={36} className="sm:w-12 sm:h-12" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-center">Protocol Fee Protection</h3>
                <p className="text-gray-400 text-center text-sm sm:text-base">
                  Our protocol implements a transparent fee system with a maximum cap of 10%, ensuring fair treatment for all users while maintaining protocol sustainability.
                </p>
              </div>
              <div className="p-4 sm:p-6 border border-transparent hover:border-accent transition-all duration-300 transform hover:-translate-y-2 rounded-lg bg-gray-800/50 backdrop-blur-sm">
                <div className="text-accent mb-4 sm:mb-6 flex justify-center">
                  <FaCode size={36} className="sm:w-12 sm:h-12" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-center">OpenZeppelin Standards</h3>
                <p className="text-gray-400 text-center text-sm sm:text-base">
                  Built on industry-standard OpenZeppelin contracts for ownership and token management, providing battle-tested security foundations for your assets.
                </p>
              </div>
              <div className="p-4 sm:p-6 border border-transparent hover:border-accent transition-all duration-300 transform hover:-translate-y-2 rounded-lg bg-gray-800/50 backdrop-blur-sm">
                <div className="text-accent mb-4 sm:mb-6 flex justify-center">
                  <MdOutlinePublic size={36} className="sm:w-12 sm:h-12" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-center">Transparent Reward System</h3>
                <p className="text-gray-400 text-center text-sm sm:text-base">
                  Our reward distribution system is fully transparent with on-chain verification, allowing users to track and claim their CIRQA rewards at any time.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-b from-secondary to-background relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 sm:w-40 sm:h-40 rounded-full bg-accent blur-3xl animate-pulse duration-5000"></div>
            <div className="absolute bottom-10 right-10 w-30 h-30 sm:w-60 sm:h-60 rounded-full bg-primary blur-3xl animate-pulse duration-7000 delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-80 sm:h-80 rounded-full bg-purple-500/10 blur-3xl animate-pulse duration-8000"></div>
          </div>
          <div className="container mx-auto text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-6 text-white">HOW IT WORKS</h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 sm:mb-12 md:mb-16 max-w-2xl mx-auto">
              Cirqa makes DeFi simple and accessible for everyone. Follow these three easy steps to start your journey.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12 relative">
              {/* Connecting lines between steps - responsive */}
              <div className="hidden md:block absolute top-24 left-1/3 right-1/3 h-1 bg-gradient-to-r from-accent to-primary"></div>
              
              <div className="card p-4 sm:p-6 md:p-8 hover:border-accent transition-all duration-500 transform hover:-translate-y-3 hover:shadow-xl hover:shadow-accent/20">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-accent rounded-full flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold mx-auto mb-4 sm:mb-6 shadow-lg shadow-accent/30 border-4 border-background">
                  1
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-center">Supply Assets</h3>
                <p className="text-gray-400 text-center text-sm sm:text-base md:text-lg">
                  Connect your wallet and supply your crypto assets to the Cirqa Protocol to earn CIRQA token rewards and enable borrowing capabilities.
                </p>
              </div>
              <div className="card p-4 sm:p-6 md:p-8 hover:border-accent transition-all duration-500 transform hover:-translate-y-3 hover:shadow-xl hover:shadow-accent/20">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-accent rounded-full flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold mx-auto mb-4 sm:mb-6 shadow-lg shadow-accent/30 border-4 border-background">
                  2
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-center">Set Collateral Status</h3>
                <p className="text-gray-400 text-center text-sm sm:text-base md:text-lg">
                  Choose which of your supplied assets to use as collateral with our flexible setCollateralStatus feature, giving you complete control.
                </p>
              </div>
              <div className="card p-4 sm:p-6 md:p-8 hover:border-accent transition-all duration-500 transform hover:-translate-y-3 hover:shadow-xl hover:shadow-accent/20">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-accent rounded-full flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold mx-auto mb-4 sm:mb-6 shadow-lg shadow-accent/30 border-4 border-background">
                  3
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-center">Borrow & Earn Rewards</h3>
                <p className="text-gray-400 text-center text-sm sm:text-base md:text-lg">
                  Borrow assets with transparent fees (max 10%) and earn additional CIRQA rewards based on your borrowing activity, with rewards claimable anytime.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Standalone CTA Section - Outside of other sections */}
      <div className="py-10 sm:py-16 px-4 bg-gradient-to-r from-purple-600 via-accent to-blue-600 relative overflow-hidden">
        {/* Animated elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/globe.svg')] bg-no-repeat bg-center opacity-10"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white/10 animate-float"></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-white/10 animate-float-delay"></div>
            <div className="absolute top-1/2 left-1/4 w-12 h-12 rounded-full bg-white/10 animate-float-slow"></div>
          </div>
        </div>
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-6 text-white">Ready to Earn CIRQA Rewards?</h2>
          <p className="text-base sm:text-lg md:text-xl text-white/80 mb-6 sm:mb-10 max-w-2xl mx-auto">
            Join the Cirqa Protocol and start earning CIRQA tokens by supplying and borrowing assets. With transparent fees, flexible collateral options, and a secure reward system, your DeFi journey starts here!
          </p>
          <Link href="/app" className="inline-flex items-center justify-center text-base sm:text-lg md:text-xl py-3 sm:py-4 md:py-5 px-8 sm:px-10 md:px-12 bg-white text-black hover:bg-white/90 transition-all duration-300 rounded-full font-bold shadow-lg shadow-black/20 transform hover:translate-y-[-4px] hover:shadow-xl">
            <span>Get Started Now</span>
            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ml-2 sm:ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </Link>
          <p className="text-white/70 mt-4 sm:mt-8 text-xs sm:text-sm">
            No credit card required. Protocol fees capped at 10%. Full control of your assets with flexible collateral options. Earn CIRQA rewards on both supply and borrow activities.
          </p>
        </div>
      </div>
      

      
      {/* Add custom animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delay {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delay {
          animation: float-delay 8s ease-in-out infinite 1s;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite 2s;
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        .duration-5000 {
          animation-duration: 5000ms;
        }
        .duration-7000 {
          animation-duration: 7000ms;
        }
        .duration-8000 {
          animation-duration: 8000ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
      `}</style>
      
    </div>
  );
}
