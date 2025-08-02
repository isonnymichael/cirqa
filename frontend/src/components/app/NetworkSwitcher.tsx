'use client';

import React, { useEffect, useState } from 'react';
import { useActiveWallet, useActiveWalletChain } from 'thirdweb/react';
import { kiiTestnet } from '@/lib/chain';
import NotificationBanner from './NotificationBanner';

const NetworkSwitcher: React.FC = () => {
  const activeChain = useActiveWalletChain();
  const wallet = useActiveWallet();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [switchingNetwork, setSwitchingNetwork] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeChain) {
      setIsWrongNetwork(activeChain.id !== kiiTestnet.id);
    }
  }, [activeChain]);

  const handleSwitchNetwork = async () => {
    if (!wallet) return;

    try {
      setSwitchingNetwork(true);
      setError(null);
      await wallet.switchChain(kiiTestnet.id);
      setIsWrongNetwork(false);
    } catch (err) {
      console.error('Failed to switch network:', err);
      setError(
        'Failed to switch network. Please try manually switching to Kii Testnet in your wallet.'
      );
    } finally {
      setSwitchingNetwork(false);
    }
  };

  if (!isWrongNetwork) return null;

  return (
    <div className="mb-4">
      <NotificationBanner
        type="warning"
        message={
          <div className="flex flex-col sm:flex-row sm:items-center">
            <span className="flex-1">
              You are connected to the wrong network. This app works on Kii Testnet.
              {error && <span className="block mt-1 text-yellow-200">{error}</span>}
            </span>
            <button
              onClick={handleSwitchNetwork}
              disabled={switchingNetwork}
              className="mt-2 sm:mt-0 sm:ml-4 px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {switchingNetwork ? 'Switching...' : 'Switch Network'}
            </button>
          </div>
        }
        dismissible={false}
        showIcon={true}
      />
    </div>
  );
};

export default NetworkSwitcher;
