'use client';

import React from 'react';
import { ConnectButton, useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { createWallet } from 'thirdweb/wallets';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { kiiTestnet } from '@/lib/chain';
import ThemeToggle from '@/components/app/ThemeToggle';

const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

const wallets = [
    createWallet('io.metamask'),
    createWallet('com.coinbase.wallet'),
    createWallet('me.rainbow'),
];

const Header = () => {
  const pathname = usePathname();
  const isAppPage = pathname === '/app' || pathname.startsWith('/app/');
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const [isSwitching, setIsSwitching] = React.useState(false);
  
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
          
          {isAppPage && (
            <nav className="hidden md:flex ml-6 space-x-4">
              <Link 
                href="/app" 
                className={`text-sm px-3 py-2 rounded-md transition-colors ${pathname === '/app' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              >
                Dashboard
              </Link>
              <Link 
                href="/app/metadata" 
                className={`text-sm px-3 py-2 rounded-md transition-colors ${pathname === '/app/metadata' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              >
                Metadata Generator
              </Link>
            </nav>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          {isAppPage ? (
            <ConnectButton 
                client={client} 
                wallets={wallets}
                chain={kiiTestnet}
                connectModal={{ size: 'compact' }}
            />
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