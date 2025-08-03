'use client';

import React from 'react';
import { ConnectButton, useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { createWallet } from 'thirdweb/wallets';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { kiiTestnet } from '@/lib/chain';

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
    <header className="bg-secondary py-3 md:py-4 border-b border-gray-800">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="flex items-center">
              <Image 
                src="/cirqa-logo.svg" 
                alt="Cirqa Logo" 
                width={32} 
                height={32}
                className="md:w-10 md:h-10"
                priority
              />
              <span className="text-white font-bold text-lg md:text-xl ml-1">Cirqa</span>
            </div>
          </Link>
        </div>
        <div className="flex items-center">
          {isAppPage ? (
            <ConnectButton 
                client={client} 
                wallets={wallets}
                chain={kiiTestnet}
                connectModal={{ size: 'compact' }}
            />
          ) : (
            <Link href="/app" className="btn-primary hover:bg-accent hover:text-white transition-colors px-3 py-2 md:px-4 md:py-2 text-sm md:text-base">
              Launch
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;