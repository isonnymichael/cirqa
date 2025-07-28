'use client';

import React, { useState } from 'react';
import Spinner from '@/app/Spinner';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { formatUnits } from 'ethers';
import { cirqaProtocolContract } from '@/lib/contracts';
import { FaInfoCircle } from 'react-icons/fa';

const UserStats: React.FC = () => {
  const account = useActiveAccount();

  const { data: globalUserInfo, isLoading: isGlobalUserInfoLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'function getGlobalUserInfo(address user) view returns (uint256, uint256, uint256)',
    params: [account?.address || ''],
    queryOptions: { enabled: !!account },
  });

  const formatDisplayValue = (value: any, decimals = 18, prefix = '', suffix = '') => {
    console.log(value);
    if (value === undefined || value === null) return '...';
    const formatted = parseFloat(formatUnits(value, decimals)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    console.log(formatted);
    return `${prefix}${formatted}${suffix}`;
  };

  // Use optional chaining and nullish coalescing to safely handle undefined data
  console.log(globalUserInfo);
  const totalSupplied = globalUserInfo?.[0] ?? undefined;
  const totalBorrowed = globalUserInfo?.[1] ?? undefined;
  const totalPendingCirqa = globalUserInfo?.[2] ?? undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-1">Total Supplied</div>
                <div className="text-xl font-bold">{isGlobalUserInfoLoading ? <Spinner /> : formatDisplayValue(totalSupplied, 8, '$')}</div>
      </div>
      
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-1">Total Borrowed</div>
                <div className="text-xl font-bold">{isGlobalUserInfoLoading ? <Spinner /> : formatDisplayValue(totalBorrowed, 8, '$')}</div>
      </div>
      
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-1 flex items-center">
          <span>CRQ Rewards</span>
          <div className="relative group ml-2">
            <FaInfoCircle className="text-gray-400 hover:text-accent cursor-pointer" size={14} />
            <div className="absolute left-0 bottom-full mb-2 w-64 bg-gray-800 p-3 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-xs">
              CRQ Rewards are automatically earned through supply or borrow activities. Rewards accumulate every second and do not need to be claimed manually.
            </div>
          </div>
        </div>
        <div className="text-xl font-bold">{isGlobalUserInfoLoading ? <Spinner /> : formatDisplayValue(totalPendingCirqa, 18, '', ' CRQ')}</div>
      </div>
    </div>
  );
};

export default UserStats;