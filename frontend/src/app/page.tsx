import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FaLock, FaChartLine, FaCode } from "react-icons/fa";
import { RiMoneyDollarCircleFill, RiExchangeDollarFill, RiHandCoinFill } from "react-icons/ri";
import { MdSecurity, MdOutlineVerified, MdOutlinePublic } from "react-icons/md";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-secondary to-background">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">LENDING PROTOCOL FOR RWAs</h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
              Seamless and secure lending, borrowing, and yield for crypto native RWA on KiiChain with Cirqa.
            </p>
            <Link href="/app" className="btn-primary text-lg py-3 px-8 bg-accent hover:bg-accent/90 hover:scale-105 transition-all duration-300 inline-flex items-center">
              <span>Launch App</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
              </svg>
            </Link>
          </div>
        </section>
        
        {/* Stats Section */}
        <section className="py-16 bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6 flex flex-col items-center">
                <div className="text-accent mb-4">
                  <RiMoneyDollarCircleFill size={40} />
                </div>
                <h3 className="text-3xl font-bold mb-2">$12.5M+</h3>
                <p className="text-gray-400">Total Value Locked</p>
              </div>
              <div className="p-6 flex flex-col items-center">
                <div className="text-accent mb-4">
                  <FaChartLine size={40} />
                </div>
                <h3 className="text-3xl font-bold mb-2">8,750+</h3>
                <p className="text-gray-400">Active Users</p>
              </div>
              <div className="p-6 flex flex-col items-center">
                <div className="text-accent mb-4">
                  <RiExchangeDollarFill size={40} />
                </div>
                <h3 className="text-3xl font-bold mb-2">125,000+</h3>
                <p className="text-gray-400">Total Transactions</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16">CORE FEATURES</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="card p-6 hover:border-accent transition-all duration-300 transform hover:-translate-y-2">
                <div className="text-accent mb-6 flex justify-center">
                  <RiHandCoinFill size={48} />
                </div>
                <h3 className="text-xl font-bold mb-4 text-center">Decentralized Lending and Borrowing</h3>
                <p className="text-gray-400 text-center">
                  Users can lend and borrow cryptocurrencies through liquidity pools, earning interest or using crypto assets as collateral.
                </p>
              </div>
              <div className="card p-6 hover:border-accent transition-all duration-300 transform hover:-translate-y-2">
                <div className="text-accent mb-6 flex justify-center">
                  <FaChartLine size={48} />
                </div>
                <h3 className="text-xl font-bold mb-4 text-center">Algorithmic Interest Rates</h3>
                <p className="text-gray-400 text-center">
                  Cirqa uses an algorithmic model to set interest rates in real-time based on the supply and demand for each asset in the market.
                </p>
              </div>
              <div className="card p-6 hover:border-accent transition-all duration-300 transform hover:-translate-y-2">
                <div className="text-accent mb-6 flex justify-center">
                  <FaLock size={48} />
                </div>
                <h3 className="text-xl font-bold mb-4 text-center">Over-collateralization</h3>
                <p className="text-gray-400 text-center">
                  Borrowers provide collateral that exceeds the value of the loan. This ensures that the protocol remains solvent even if the borrower fails to repay.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Security Section */}
        <section className="py-20 px-4 bg-gray-800">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">AUDITED AND VERIFIED</h2>
            <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
              THE MOST SECURE MONEY PROTOCOL
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="p-6 hover:border-accent transition-all duration-300 transform hover:-translate-y-2">
                <div className="text-accent mb-6 flex justify-center">
                  <MdSecurity size={48} />
                </div>
                <h3 className="text-xl font-bold mb-4 text-center">Security Audits</h3>
                <p className="text-gray-400 text-center">
                  Our team of specialists has meticulously audited the Cirqa smart contracts, ensuring a secure and reliable platform you can trust.
                </p>
              </div>
              <div className="p-6 hover:border-accent transition-all duration-300 transform hover:-translate-y-2">
                <div className="text-accent mb-6 flex justify-center">
                  <FaCode size={48} />
                </div>
                <h3 className="text-xl font-bold mb-4 text-center">Open Source</h3>
                <p className="text-gray-400 text-center">
                  The smart contracts are open source, providing complete transparency and allowing the community to verify and contribute to their security.
                </p>
              </div>
              <div className="p-6 hover:border-accent transition-all duration-300 transform hover:-translate-y-2">
                <div className="text-accent mb-6 flex justify-center">
                  <MdOutlinePublic size={48} />
                </div>
                <h3 className="text-xl font-bold mb-4 text-center">Decentralized</h3>
                <p className="text-gray-400 text-center">
                  The protocol is decentralized, reducing the risk of single points of failure and promoting trust and inclusivity.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-secondary to-background relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-accent blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-primary blur-3xl"></div>
          </div>
          <div className="container mx-auto text-center relative z-10">
            <h2 className="text-4xl font-bold mb-6 text-white">HOW IT WORKS</h2>
            <p className="text-xl text-gray-400 mb-16 max-w-2xl mx-auto">
              Cirqa makes DeFi simple and accessible for everyone. Follow these three easy steps to start your journey.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connecting lines between steps */}
              <div className="hidden md:block absolute top-24 left-1/3 right-1/3 h-1 bg-gradient-to-r from-accent to-primary"></div>
              
              <div className="card p-8 hover:border-accent transition-all duration-500 transform hover:-translate-y-3 hover:shadow-xl hover:shadow-accent/20">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg shadow-accent/30 border-4 border-background">
                  1
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center">Supply Assets</h3>
                <p className="text-gray-400 text-center text-lg">
                  Connect your wallet and supply your crypto assets to the protocol to contribute to the liquidity pool and start earning.
                </p>
              </div>
              <div className="card p-8 hover:border-accent transition-all duration-500 transform hover:-translate-y-3 hover:shadow-xl hover:shadow-accent/20">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg shadow-accent/30 border-4 border-background">
                  2
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center">Earn Interest</h3>
                <p className="text-gray-400 text-center text-lg">
                  Watch your investments grow with competitive interest rates. Earn passive income while supporting the DeFi ecosystem.
                </p>
              </div>
              <div className="card p-8 hover:border-accent transition-all duration-500 transform hover:-translate-y-3 hover:shadow-xl hover:shadow-accent/20">
                <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg shadow-accent/30 border-4 border-background">
                  3
                </div>
                <h3 className="text-2xl font-bold mb-4 text-center">Borrow Assets</h3>
                <p className="text-gray-400 text-center text-lg">
                  Need liquidity? Borrow assets easily and securely using your supplied assets as collateral, with transparent terms.
                </p>
              </div>
            </div>
            
            {/* Removed Enhanced CTA Section from here */}
          </div>
        </section>
      </main>
      
      {/* Standalone CTA Section - Outside of other sections */}
      <div className="py-16 px-4 bg-gradient-to-r from-purple-600 via-accent to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('/globe.svg')] bg-no-repeat bg-center opacity-10"></div>
        </div>
        <div className="container mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6 text-white">Ready to Revolutionize Your Finance?</h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join thousands of users who are already benefiting from Cirqa's secure and efficient DeFi platform. Start your journey today!
          </p>
          <Link href="/app" className="inline-flex items-center justify-center text-xl py-5 px-12 bg-white text-black hover:bg-white/90 transition-all duration-300 rounded-full font-bold shadow-lg shadow-black/20 transform hover:translate-y-[-4px] hover:shadow-xl">
            <span>Get Started Now</span>
            <svg className="w-7 h-7 ml-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
            </svg>
          </Link>
          <p className="text-white/70 mt-8 text-sm">
            No credit card required. Start with as little as you want. Full control of your assets.
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
