'use client';

import React from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { formatUnits } from 'ethers';
import { cirqaProtocolContract } from '@/lib/contracts';

const UserStats: React.FC = () => {
  const account = useActiveAccount();
  const assetPid = 0; // Example: using the first asset pool (pid=0)

  const { data: userInfo, isLoading: isUserInfoLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'userInfo',
    params: [assetPid, account?.address || ''],
    queryOptions: { enabled: !!account },
  });

  const { data: pendingCirqa, isLoading: isPendingCirqaLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'pendingCirqa',
    params: [assetPid, account?.address || ''],
    queryOptions: { enabled: !!account },
  });

  const formatDisplayValue = (value: any, decimals = 18, prefix = '', suffix = '') => {
    if (value === undefined || value === null) return '...';
    const formatted = parseFloat(formatUnits(value, decimals)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${prefix}${formatted}${suffix}`;
  };

  // Assuming 'points' represents supplied amount for suppliers
  // and half the borrowed amount for borrowers.
  // This is a simplification. A real app would need to distinguish between supply and borrow points.
  const suppliedAmount = userInfo ? userInfo[0] : BigInt(0);
  
  // This is a simplification. In the contract, borrow points are 1/2 of the borrowed amount.
  // We can't easily distinguish supplied vs borrowed points from `userInfo` alone.
  // For this example, we'll just display the points as 'Supplied/Borrowed Points'.

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-1">Total Supplied</div>
        <div className="text-xl font-bold">{isUserInfoLoading ? 'Loading...' : formatDisplayValue(suppliedAmount, 18, '$')}</div>
      </div>
      
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-1">Total Borrowed</div>
        <div className="text-xl font-bold">{isUserInfoLoading ? 'Loading...' : formatDisplayValue(BigInt(0), 18, '$')}</div>
      </div>
      
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-1">CRQ Rewards</div>
        <div className="text-xl font-bold">{isPendingCirqaLoading ? 'Loading...' : formatDisplayValue(pendingCirqa, 18, '', ' CRQ')}</div>
      </div>
    </div>
  );
};

export default UserStats;