'use client';

import React from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { formatUnits } from 'ethers';
import { cirqaProtocolContract } from '@/lib/contracts';

const UserStats: React.FC = () => {
  const account = useActiveAccount();

  const { data: globalUserInfo, isLoading: isGlobalUserInfoLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'getGlobalUserInfo',
    params: [account?.address || ''],
    queryOptions: { enabled: !!account },
  });

  const formatDisplayValue = (value: any, decimals = 18, prefix = '', suffix = '') => {
    if (value === undefined || value === null) return '...';
    const formatted = parseFloat(formatUnits(value, decimals)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${prefix}${formatted}${suffix}`;
  };

  const totalSupplied = globalUserInfo ? globalUserInfo[0] : BigInt(0);
  const totalBorrowed = globalUserInfo ? globalUserInfo[1] : BigInt(0);
  const totalPendingCirqa = globalUserInfo ? globalUserInfo[2] : BigInt(0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-1">Total Supplied</div>
        <div className="text-xl font-bold">{isGlobalUserInfoLoading ? 'Loading...' : formatDisplayValue(totalSupplied, 18, '$')}</div>
      </div>
      
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-1">Total Borrowed</div>
        <div className="text-xl font-bold">{isGlobalUserInfoLoading ? 'Loading...' : formatDisplayValue(totalBorrowed, 18, '$')}</div>
      </div>
      
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-1">CRQ Rewards</div>
        <div className="text-xl font-bold">{isGlobalUserInfoLoading ? 'Loading...' : formatDisplayValue(totalPendingCirqa, 18, '', ' CRQ')}</div>
      </div>
    </div>
  );
};

export default UserStats;