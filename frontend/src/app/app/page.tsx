'use client';

import React, { useState, useEffect } from 'react';
import CreateScholarshipModal from '@/components/app/CreateScholarshipModal';
import ScholarshipList from '@/components/app/ScholarshipList';
import ScholarshipStats from '@/components/app/ScholarshipStats';
import TokenInfo from '@/components/app/TokenInfo';
import NotificationBanner from '@/components/app/NotificationBanner';
import NetworkSwitcher from '@/components/app/NetworkSwitcher';
import LoadingScreen from '@/components/app/LoadingScreen';
import { useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { kiiTestnet } from '@/lib/chain';

export default function AppPage() {
  const [activeTab, setActiveTab] = useState('scholarship');
  const [isCreateScholarshipModalOpen, setIsCreateScholarshipModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleScholarshipCreated = () => {
    setIsCreateScholarshipModalOpen(false);
    // Optionally, refresh the scholarship list here if needed
  };

  const handleOpenCreateScholarshipModal = () => {
    setIsCreateScholarshipModalOpen(true);
  };

  const handleCloseCreateScholarshipModal = () => {
    setIsCreateScholarshipModalOpen(false);
  };
  
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  
  useEffect(() => {
    // Simulate loading time for data fetching
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
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

  if (isLoading) {
    return <LoadingScreen message="Loading Cirqa Scholarship Platform..." />;
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <NetworkSwitcher />
          
          <div className="mb-6">
            <NotificationBanner 
              type="info" 
              message="This platform is currently in beta testing on the Kii Testnet. All scholarships and transactions are for demonstration purposes only." 
            />
          </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cirqa Scholarship Platform</h1>
          <p className="text-gray-400">Create scholarships, fund students, and earn CIRQA tokens as rewards</p>
        </div>
        
        {/* User Token Info */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Wallet</h2>
          <TokenInfo />
        </div>
        
        {/* Scholarship Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Platform Statistics</h2>
          <ScholarshipStats />
        </div>
        
        {/* Scholarship Sections */}
        <div className="mt-8">
          <div className="mt-8">
            <div className="flex justify-end mb-4">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleOpenCreateScholarshipModal}
              >
                Create New Scholarship
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              <ScholarshipList />
            </div>
          </div>

        </div>

        <CreateScholarshipModal
          isOpen={isCreateScholarshipModalOpen}
          onClose={handleCloseCreateScholarshipModal}
          onScholarshipCreated={handleScholarshipCreated}
        />
      </div>
    </main>
  );
}