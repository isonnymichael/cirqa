'use client'

import Link from "next/link";
import Header from "@/components/layout/Header";
import { FaLock, FaChartLine, FaCode } from "react-icons/fa";
import { RiMoneyDollarCircleFill, RiSecurePaymentFill, RiCommunityFill, RiUserStarFill, RiExchangeDollarFill, RiHandCoinFill } from "react-icons/ri";
import { MdSecurity, MdOutlinePublic } from "react-icons/md";
import React, { useState } from 'react';


export default function Home() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [showSampleMetadata, setShowSampleMetadata] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const toggleSampleMetadata = () => {
    setShowSampleMetadata(!showSampleMetadata);
  };

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
              SCHOLARSHIP PLATFORM FOR STUDENTS
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-8 sm:mb-12 max-w-3xl mx-auto">
                Seamless and secure scholarship funding for students on KiiChain with Cirqa Protocol. Connect students with investors and earn CIRQA tokens as rewards.
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
                  <RiUserStarFill size={32} className="sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">8,420+</h3>
                <p className="text-gray-400 text-sm sm:text-base">Students Empowered</p>
              </div>

              <div className="p-4 sm:p-6 flex flex-col items-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-accent mb-3 sm:mb-4">
                  <RiCommunityFill size={32} className="sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">1,200+</h3>
                <p className="text-gray-400 text-sm sm:text-base">Active Investors</p>
              </div>

              <div className="p-4 sm:p-6 flex flex-col items-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-accent mb-3 sm:mb-4">
                  <RiSecurePaymentFill size={32} className="sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">$5.7M</h3>
                <p className="text-gray-400 text-sm sm:text-base">Scholarships Funded</p>
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
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-center">Decentralized Scholarship Funding</h3>
                <p className="text-gray-400 text-center text-sm sm:text-base">
                  Fund scholarships to support students and earn CIRQA tokens as rewards with transparent terms on the Cirqa Protocol.
                </p>
              </div>
              <div className="card p-4 sm:p-6 hover:border-accent transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg hover:shadow-accent/10">
                <div className="text-accent mb-4 sm:mb-6 flex justify-center">
                  <FaChartLine size={36} className="sm:w-12 sm:h-12" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-center">CIRQA Token Rewards</h3>
                <p className="text-gray-400 text-center text-sm sm:text-base">
                  Investors receive CIRQA tokens as rewards for funding student scholarships. The more you contribute, the more CIRQA you earn—aligning financial incentives with social impact.
                </p>
              </div>
              <div className="card p-4 sm:p-6 hover:border-accent transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg hover:shadow-accent/10">
                <div className="text-accent mb-4 sm:mb-6 flex justify-center">
                  <FaLock size={36} className="sm:w-12 sm:h-12" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-center">Secure Scholarship Management</h3>
                <p className="text-gray-400 text-center text-sm sm:text-base">
                  Students have complete control over their scholarships with secure withdrawal options, while investors can track their contributions and rewards.
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
              THE MOST SECURE SCHOLARSHIP PLATFORM
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
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4 text-center">On-Chain Transparency</h3>
                <p className="text-gray-400 text-center text-sm sm:text-base">
                  All scholarship funding and CIRQA reward distributions are recorded on-chain, ensuring full transparency. Investors and students can verify transactions and rewards anytime.
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
              Cirqa connects students and investors in a decentralized scholarship system powered by blockchain. Here’s how it works:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700 hover:border-accent transition-all duration-300">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RiMoneyDollarCircleFill className="text-blue-500 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Apply for Scholarship</h3>
                <p className="text-gray-400">
                  Students create a scholarship profile by minting an NFT that stores their credentials and documents.
                </p>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700 hover:border-accent transition-all duration-300">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RiExchangeDollarFill className="text-blue-500 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Invest in a Student</h3>
                <p className="text-gray-400">
                  Investors fund scholarships by sending USDT directly to students' NFT contracts, supporting their education goals.
                </p>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-lg border border-gray-700 hover:border-accent transition-all duration-300">
                <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RiHandCoinFill className="text-blue-500 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Access the Funds</h3>
                <p className="text-gray-400">
                  Students can securely withdraw scholarship funds in USDT, with full transparency and traceability on-chain.
                </p>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
              <h3 className="text-xl font-semibold mb-2">Investor Rewards</h3>
              <p className="text-gray-400">
                For every USDT you invest, you earn CIRQA tokens based on a fixed reward rate. CIRQA tokens grant governance rights and future utility within the Cirqa ecosystem.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 sm:py-16 md:py-20 px-4 bg-gray-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-repeat opacity-10"></div>
          </div>
          
          <div className="container mx-auto relative z-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">FREQUENTLY ASKED QUESTIONS</h2>
            
            <div className="max-w-3xl mx-auto space-y-6">
              {[
                {
                  question: "What is Cirqa Scholarship Platform?",
                  answer: "Cirqa is a decentralized platform that connects students seeking educational funding with investors who want to support education while earning rewards in the form of CIRQA tokens."
                },
                {
                  question: "How do I create a scholarship?",
                  answer: "As a student, you can create a scholarship by clicking the \"Create New Scholarship\" button, providing an metadata hash containing your information, and submitting the transaction. You'll receive an NFT representing your scholarship."
                },
                {
                  question: "How do I fund a scholarship?",
                  answer: "As an investor, you can browse available scholarships and click the \"Fund\" button on any scholarship you wish to support. Enter the amount of USDT you want to contribute and confirm the transaction. You'll receive CIRQA tokens as a reward."
                }
              ].map((faq, index) => (
                <div key={index} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-accent rounded-lg transition-all duration-300">
                  <button 
                    onClick={() => toggleFaq(index)}
                    className="cursor-pointer w-full text-left p-4 sm:p-6 flex justify-between items-center"
                  >
                    <h3 className="text-lg font-semibold">{faq.question}</h3>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 transition-transform ${openFaqIndex === index ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-gray-400">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-6 text-white">Ready to Support Students?</h2>
          <p className="text-base sm:text-lg md:text-xl text-white/80 mb-6 sm:mb-10 max-w-2xl mx-auto">
            Join the Cirqa Scholarship Platform and start earning CIRQA tokens by funding scholarships. With transparent fees, secure fund management, and a rewarding system, your journey to support education starts here!
          </p>
          <Link href="/app" className="inline-flex items-center justify-center text-base sm:text-lg md:text-xl py-3 sm:py-4 md:py-5 px-8 sm:px-10 md:px-12 bg-white text-black hover:bg-white/90 transition-all duration-300 rounded-full font-bold shadow-lg shadow-black/20 transform hover:translate-y-[-4px] hover:shadow-xl">
            <span>Get Started Now</span>
            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 ml-2 sm:ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </Link>
          <p className="text-white/70 mt-4 sm:mt-8 text-xs sm:text-sm">
            No credit card required. Protocol fees capped at 10%. Full control for students over their scholarships. Earn CIRQA rewards when funding scholarships.
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
