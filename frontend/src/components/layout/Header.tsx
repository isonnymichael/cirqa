'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Header = () => {
  const pathname = usePathname();
  const isAppPage = pathname === '/app' || pathname.startsWith('/app/');
  
  return (
    <header className="bg-secondary py-4 border-b border-gray-800">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center">
            <div className="flex items-center">
              <Image 
                src="/cirqa-logo.svg" 
                alt="Cirqa Logo" 
                width={40} 
                height={40} 
                priority
              />
              <span className="text-white font-bold text-xl ml-1">Cirqa</span>
            </div>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {isAppPage ? (
            <button className="btn-primary hover:bg-accent hover:text-white transition-all">
              Connect Wallet
            </button>
          ) : (
            <Link href="/app" className="btn-primary hover:bg-accent hover:text-white transition-colors">
              Launch
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;