'use client';

import React from 'react';

const UserStats = () => {
  // This would be populated with real data in a functional app
  const userStats = {
    netWorth: '$0.00',
    netAPY: '0.00%',
    supplying: '$0.00',
    borrowing: '$0.00',
    rewards: '0.00',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-1">Net Worth</div>
        <div className="text-xl font-bold">{userStats.netWorth}</div>
      </div>
      
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-1">Net APY</div>
        <div className="text-xl font-bold">{userStats.netAPY}</div>
      </div>
      
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-1">Supplying</div>
        <div className="text-xl font-bold">{userStats.supplying}</div>
      </div>
      
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-1">Borrowing</div>
        <div className="text-xl font-bold">{userStats.borrowing}</div>
      </div>
      
      <div className="card p-4">
        <div className="text-sm text-gray-400 mb-1">CRQ Rewards</div>
        <div className="text-xl font-bold">{userStats.rewards}</div>
      </div>
    </div>
  );
};

export default UserStats;