'use client';

import React, { useState } from 'react';
import { useActiveAccount, useActiveWalletChain, useReadContract } from 'thirdweb/react';
import { kiiTestnet } from '@/lib/chain';
import { cirqaTokenContract, cirqaProtocolContract } from '@/lib/contracts';
import { formatUnits } from 'ethers';

// Components for the lending/borrowing app
import MarketOverview from '@/components/app/MarketOverview';
import AssetList from '@/components/app/AssetList';
import UserStats from '@/components/app/UserStats';

export default function AppPage() {
  const [activeTab, setActiveTab] = useState('supply');
  const account = useActiveAccount();
  const chain = useActiveWalletChain();



  if (!account || (chain && chain.id !== kiiTestnet.id)) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-gray-400">Please connect your wallet and switch to the Kii Testnet to use the app.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cirqa Markets</h1>
          <p className="text-gray-400">Supply assets and earn interest or borrow against your collateral</p>
        </div>
        
        {/* User Stats */}
        <UserStats />
        
        {/* Market Overview */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Market Overview</h2>
          <MarketOverview />
        </div>
        
        {/* Supply and Borrow Tabs */}
        <div className="mt-8">
          <div className="flex border-b border-gray-800 mb-6">
            <button
              className={`py-2 px-4 font-medium cursor-pointer ${activeTab === 'supply' ? 'text-accent border-b-2 border-accent' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('supply')}
            >
              Supply
            </button>
            <button
              className={`py-2 px-4 font-medium cursor-pointer ${activeTab === 'borrow' ? 'text-accent border-b-2 border-accent' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('borrow')}
            >
              Borrow
            </button>
          </div>
          
          {/* Asset List based on active tab */}
          <AssetList type={activeTab as 'supply' | 'borrow'} />
        </div>
      </div>
    </main>
  );
}