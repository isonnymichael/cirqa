'use client';

import React, { useState, useEffect } from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import Spinner from '@/app/Spinner';
import { useReadContract } from 'thirdweb/react';
import { formatUnits } from 'ethers';
import { cirqaProtocolContract } from '@/lib/contracts';

type ScholarshipStatsProps = {
  className?: string;
};

const ScholarshipStats: React.FC<ScholarshipStatsProps> = ({ className = '' }) => {

  // Get the current token ID counter to determine total scholarships
  const { data: currentTokenId, isLoading: isTokenIdLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'function _tokenIds() view returns (uint256)',
    params: [],
  });

  const { data: rewardRate, isLoading: isRewardRateLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'function rewardRate() view returns (uint256)',
    params: [],
  });

  const { data: protocolFee, isLoading: isProtocolFeeLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'function protocolFee() view returns (uint256)',
    params: [],
  });

  const formatDisplayValue = (value: any, decimals = 18, prefix = '', suffix = '') => {
    if (value === undefined || value === null) return '...';
    const formatted = parseFloat(formatUnits(value, decimals)).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    return `${prefix}${formatted}${suffix}`;
  };

  return (
    <div className={`card p-6 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-sm text-gray-400 mb-1">Total Scholarships</div>
          <div className="text-2xl font-bold">
            {isTokenIdLoading ? <Spinner /> : currentTokenId?.toString()}
          </div>
          <div className="text-xs text-gray-400 mt-1">Created on the platform</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-1">Reward Rate</div>
          <div className="text-2xl font-bold">
            {isRewardRateLoading ? <Spinner /> : formatDisplayValue(rewardRate, 18, '', ' CIRQA')}
          </div>
          <div className="text-xs text-gray-400 mt-1">Per 1 USDT invested</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-1 flex items-center">
            <span>Protocol Fee</span>
            <div className="relative group ml-2">
              <FaInfoCircle className="text-gray-400 hover:text-accent cursor-pointer" size={14} />
              <div className="absolute left-0 bottom-full mb-2 w-64 bg-gray-800 p-3 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 text-xs">
                This fee is deducted from student withdrawals (1% by default) and goes to the protocol treasury to support ongoing development and maintenance. The maximum fee is 10%.
              </div>
            </div>
          </div>
          <div className="text-2xl font-bold">
            {isProtocolFeeLoading ? <Spinner /> : `${(Number(protocolFee) / 100).toFixed(2)}%`}
          </div>
          <div className="text-xs text-gray-400 mt-1">Applied to withdrawals</div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipStats;