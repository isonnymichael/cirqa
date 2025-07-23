import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      {/* Hero Section */}
      <main className="flex-grow">
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">LENDING PROTOCOL FOR RWAs</h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
              Seamless and secure lending, borrowing, and yield for crypto native RWA on KiiChain with Cirqa.
            </p>
            <Link href="/app" className="btn-primary text-lg py-3 px-8">
              Launch App
            </Link>
          </div>
        </section>
        
        {/* Stats Section */}
        <section className="py-16 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <h3 className="text-3xl font-bold mb-2">$0+</h3>
                <p className="text-gray-400">Total Value Locked</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-2">0+</h3>
                <p className="text-gray-400">Active Users</p>
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-2">0+</h3>
                <p className="text-gray-400">Total Transactions</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16">CORE FEATURES</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="card p-6">
                <h3 className="text-xl font-bold mb-4">Decentralized Lending and Borrowing</h3>
                <p className="text-gray-400">
                  Users can lend and borrow cryptocurrencies through liquidity pools, earning interest or using crypto assets as collateral.
                </p>
              </div>
              <div className="card p-6">
                <h3 className="text-xl font-bold mb-4">Algorithmic Interest Rates</h3>
                <p className="text-gray-400">
                  Cirqa uses an algorithmic model to set interest rates in real-time based on the supply and demand for each asset in the market.
                </p>
              </div>
              <div className="card p-6">
                <h3 className="text-xl font-bold mb-4">Over-collateralization</h3>
                <p className="text-gray-400">
                  Borrowers provide collateral that exceeds the value of the loan. This ensures that the protocol remains solvent even if the borrower fails to repay.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Security Section */}
        <section className="py-20 px-4 bg-secondary">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">AUDITED AND VERIFIED</h2>
            <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
              THE MOST SECURE MONEY PROTOCOL
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="card p-6">
                <h3 className="text-xl font-bold mb-4">Security Audits</h3>
                <p className="text-gray-400">
                  Our team of specialists has meticulously audited the Cirqa smart contracts, ensuring a secure and reliable platform you can trust.
                </p>
              </div>
              <div className="card p-6">
                <h3 className="text-xl font-bold mb-4">Open Source</h3>
                <p className="text-gray-400">
                  The smart contracts are open source, providing complete transparency and allowing the community to verify and contribute to their security.
                </p>
              </div>
              <div className="card p-6">
                <h3 className="text-xl font-bold mb-4">Decentralized</h3>
                <p className="text-gray-400">
                  The protocol is decentralized, reducing the risk of single points of failure and promoting trust and inclusivity.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-16">HOW IT WORKS</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="card p-6">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">1</div>
                <h3 className="text-xl font-bold mb-4">Supply Assets</h3>
                <p className="text-gray-400">
                  Supply your assets to the protocol and contribute to the liquidity pool.
                </p>
              </div>
              <div className="card p-6">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">2</div>
                <h3 className="text-xl font-bold mb-4">Earn Interest</h3>
                <p className="text-gray-400">
                  Earn interest on your supplied assets and watch your savings grow.
                </p>
              </div>
              <div className="card p-6">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">3</div>
                <h3 className="text-xl font-bold mb-4">Borrow Assets</h3>
                <p className="text-gray-400">
                  Borrow assets easily and securely using your supplied assets as collateral.
                </p>
              </div>
            </div>
            <div className="mt-12">
              <Link href="/app" className="btn-primary text-lg py-3 px-8">
                Get Started
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
