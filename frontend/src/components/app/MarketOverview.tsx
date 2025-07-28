'use client';

'use client';

import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import Spinner from '@/app/Spinner';
import { useReadContract } from 'thirdweb/react';
import { formatUnits } from 'ethers';
import { cirqaProtocolContract } from '@/lib/contracts';

const MarketOverview = () => {
  const { data: globalAssetInfo, isLoading: isGlobalAssetInfoLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'function getGlobalAssetInfo() view returns (uint256, uint256)',
    params: [],
  });

  const { data: cirqaPerSecond, isLoading: isCirqaPerSecondLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'function cirqaPerSecond() view returns (uint256)',
    params: [],
  });

  const formatDisplayValue = (value: any, decimals = 18, prefix = '', suffix = '') => {
    if (value === undefined || value === null) return '...';
    const formatted = parseFloat(formatUnits(value, decimals)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${prefix}${formatted}${suffix}`;
  };

  // Ensure we have valid data before calculations
  const dailyRewards = typeof cirqaPerSecond === 'bigint' ? cirqaPerSecond * BigInt(86400) : undefined;

  // Use optional chaining and nullish coalescing to safely handle undefined data
  const [totalValueLocked, totalBorrowed] = globalAssetInfo ?? [undefined, undefined];
  const totalSupplied = totalValueLocked; // TVL is equivalent to total supplied in this model

  return (
    <div className="card p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <div className="text-sm text-gray-400 mb-1">Total Value Locked</div>
                    <div className="text-2xl font-bold">{isGlobalAssetInfoLoading ? <Spinner /> : formatDisplayValue(totalValueLocked, 8, '$')}</div>
          <div className="text-xs text-gray-400 mt-1">Across all assets</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-1">Total Borrowed</div>
                    <div className="text-2xl font-bold">{isGlobalAssetInfoLoading ? <Spinner /> : formatDisplayValue(totalBorrowed, 8, '$')}</div>
           <div className="text-xs text-gray-400 mt-1">Across all assets</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-1">Total Supplied</div>
                    <div className="text-2xl font-bold">{isGlobalAssetInfoLoading ? <Spinner /> : formatDisplayValue(totalSupplied, 8, '$')}</div>
           <div className="text-xs text-gray-400 mt-1">Across all assets</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-1 flex items-center">
            <span>Daily Rewards</span>
            <div className="relative group ml-2">
              <FaInfoCircle className="text-gray-400 hover:text-accent cursor-pointer" size={14} />
              <div className="absolute left-0 bottom-full mb-2 w-64 bg-gray-800 p-3 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-xs">
                Daily Rewards represent the total amount of CRQ tokens distributed to users each day. These rewards are automatically earned by users who supply or borrow assets on the platform.
              </div>
            </div>
          </div>
                    <div className="text-2xl font-bold">{isCirqaPerSecondLoading ? <Spinner /> : formatDisplayValue(dailyRewards, 18, '', ' CRQ')}</div>
          <div className="text-xs text-gray-400 mt-1">Estimated daily CRQ rewards</div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;