import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-secondary py-8 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Cirqa</h3>
            <p className="text-gray-400 mb-4">
              A decentralized borrowing and lending application built on the KiiChain network.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Protocol</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/app" className="text-gray-400 hover:text-accent transition-colors">
                  App
                </Link>
              </li>
              <li>
                <Link href="/markets" className="text-gray-400 hover:text-accent transition-colors">
                  Markets
                </Link>
              </li>
              <li>
                <Link href="/stake" className="text-gray-400 hover:text-accent transition-colors">
                  Stake
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="text-gray-400 hover:text-accent transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-accent transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <a 
                  href="https://kiichain.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-accent transition-colors"
                >
                  KiiChain
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Community</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-accent transition-colors"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a 
                  href="https://discord.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-accent transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-accent transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>© {new Date().getFullYear()} Cirqa. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;