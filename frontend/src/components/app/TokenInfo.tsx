'use client';

import React, { useEffect, useState } from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { cirqaTokenContract, cirqaProtocolContract } from '@/lib/contracts';
import { formatUnits } from 'ethers';
import Spinner from '@/app/Spinner';

type TokenInfoProps = {
  className?: string;
};

const TokenInfo: React.FC<TokenInfoProps> = ({ className = '' }) => {
  const [cirqaBalance, setCirqaBalance] = useState<bigint>(BigInt(0));
  const [usdtBalance, setUsdtBalance] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const account = useActiveAccount();

  const fetchBalances = async () => {
    if (!account) return;
    
    setLoading(true);
    setError(null);
    try {
      // Get CIRQA token balance
      const cirqaBalance = await cirqaTokenContract.read.balanceOf([account.address]);
      setCirqaBalance(cirqaBalance);

      // Get USDT token address from protocol contract
      const usdtTokenAddress = await cirqaProtocolContract.read.usdtToken();
      
      // Create a contract instance for USDT
      const usdtContract = {
        abi: [{
          name: 'balanceOf',
          type: 'function',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view'
        }],
        address: usdtTokenAddress,
      };
      
      // Get USDT balance
      const usdtBalance = await useReadContract.query({
        contract: usdtContract,
        method: 'function balanceOf(address account) view returns (uint256)',
        params: [account.address],
      });
      
      setUsdtBalance(usdtBalance as bigint);
    } catch (err: any) {
      console.error('Error fetching token balances:', err);
      setError(err.message || 'Failed to load token information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchBalances();
    }
  }, [account]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-24 ${className}`}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-800 rounded-lg p-4 text-center ${className}`}>
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchBalances}
          className="mt-2 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-2">
            <span className="text-xs font-bold">CQ</span>
          </div>
          <h3 className="font-medium">CIRQA Token</h3>
        </div>
        <p className="text-2xl font-bold">{formatUnits(cirqaBalance, 18)}</p>
        <p className="text-xs text-gray-400 mt-1">Reward token for investors</p>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-2">
            <span className="text-xs font-bold">$</span>
          </div>
          <h3 className="font-medium">USDT</h3>
        </div>
        <p className="text-2xl font-bold">{formatUnits(usdtBalance, 18)}</p>
        <p className="text-xs text-gray-400 mt-1">Used for funding scholarships</p>
      </div>
    </div>
  );
};

export default TokenInfo;