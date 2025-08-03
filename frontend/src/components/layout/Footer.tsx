import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-secondary py-8 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="md:flex md:justify-between md:items-start gap-8 grid grid-cols-1">

          {/* Cirqa - tetap di kiri */}
          <div className="md:w-1/4">
            <h3 className="text-xl font-bold mb-4">Cirqa</h3>
            <p className="text-gray-400 mb-4">
              Cirqa is a decentralized platform on the KiiChain network that makes scholarship funding transparent and accessible for students.
            </p>
          </div>

          {/* Resources dan Community - di kanan dan text-nya rata kanan */}
          <div className="md:w-1/2 md:flex md:justify-end md:gap-12 text-right">

            <div>
              <h4 className="text-lg font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs" className="text-gray-400 hover:text-accent transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/#faq" className="text-gray-400 hover:text-accent transition-colors">
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
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>© {new Date().getFullYear()} Cirqa. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;