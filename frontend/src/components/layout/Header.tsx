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
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/cirqa-logo.svg" 
              alt="Cirqa Logo" 
              width={120} 
              height={40} 
              priority
            />
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