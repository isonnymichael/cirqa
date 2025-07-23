'use client';

import React from 'react';

const MarketOverview = () => {
  // Mock data for market overview
  const marketStats = {
    tvl: '$0',
    totalBorrowed: '$0',
    totalSupplied: '$0',
    dailyRewards: '0 CRQ',
  };

  return (
    <div className="card p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <div className="text-sm text-gray-400 mb-1">Total Value Locked</div>
          <div className="text-2xl font-bold">{marketStats.tvl}</div>
          <div className="text-xs text-gray-400 mt-1">TVL includes the total value of assets supplied and borrowed</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-1">Total Borrowed</div>
          <div className="text-2xl font-bold">{marketStats.totalBorrowed}</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-1">Total Supplied</div>
          <div className="text-2xl font-bold">{marketStats.totalSupplied}</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-1">Daily Rewards</div>
          <div className="text-2xl font-bold">{marketStats.dailyRewards}</div>
          <div className="text-xs text-gray-400 mt-1">Daily CRQ rewards given to lenders and borrowers</div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;