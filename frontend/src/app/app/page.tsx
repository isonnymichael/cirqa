'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import ScholarshipList from '@/components/app/ScholarshipList';
import ScholarshipStats from '@/components/app/ScholarshipStats';
import NotificationBanner from '@/components/app/NotificationBanner';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { kiiTestnet } from '@/lib/chain';

export default function AppPage() {
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  
  // State for managing view mode and stats refresh
  const [isDetailView, setIsDetailView] = useState(false);
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);

  // Handle view mode changes from ScholarshipList
  const handleViewModeChange = useCallback((detailView: boolean) => {
    console.log(`🔄 View mode changed: ${detailView ? 'Detail View' : 'List View'}`);
    setIsDetailView(detailView);
  }, []);

  // Handle stats refresh requests
  const handleRefreshStats = useCallback(() => {
    console.log('📊 Refreshing global statistics...');
    setStatsRefreshTrigger(prev => prev + 1);
  }, []);

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
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4">
          
          <div className="mb-6">
            <NotificationBanner 
              type="info" 
              message="This platform is currently in beta testing on the Kii Testnet. All scholarships and transactions are for demonstration purposes only." 
            />
          </div>
        
        {/* Scholarship Stats - Hidden during detail view */}
        {!isDetailView && (
          <div className="mb-8">
            <ScholarshipStats refreshTrigger={statsRefreshTrigger} />
          </div>
        )}
        
        {/* Scholarship Sections */}
        <div className="mt-8">
          <div className="mt-8">
            {/* Header - Hidden during detail view */}
            {!isDetailView && (
              <div className="flex justify-between mb-4">
                <h2 className="text-2xl font-bold mb-4">Scholarships</h2>

                <Link 
                  href="/app/metadata" 
                  className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-3 rounded"
                >
                  <span className="hidden md:inline">Create New Scholarship</span>
                  <span className="inline md:hidden">Create New</span>
                </Link>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              <ScholarshipList 
                onViewModeChange={handleViewModeChange}
                onRefreshStats={handleRefreshStats}
              />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}