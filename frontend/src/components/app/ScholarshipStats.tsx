'use client';

import React, { useEffect, useState } from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { cirqaProtocolContract, cirqaTokenContract } from '@/lib/contracts';
import { formatUnits } from 'ethers';
import Spinner from '@/app/Spinner';

type ScholarshipStatsProps = {
  className?: string;
};

const ScholarshipStats: React.FC<ScholarshipStatsProps> = ({ className = '' }) => {
  const [totalScholarships, setTotalScholarships] = useState<number>(0);
  const [totalFunded, setTotalFunded] = useState<bigint>(0n);
  const [rewardRate, setRewardRate] = useState<bigint>(0n);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const account = useActiveAccount();

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get reward rate
      const rate = await cirqaProtocolContract.read.rewardRate();
      setRewardRate(rate);

      // Count scholarships and total funded amount
      let count = 0;
      let funded = 0n;
      
      // We'll try to fetch scholarships with IDs from 1 to 50 (adjust as needed)
      for (let i = 1; i <= 50; i++) {
        try {
          const scholarship = await cirqaProtocolContract.read.scholarships([i]);
          if (scholarship && scholarship.exists) {
            count++;
            funded += scholarship.balance;
          }
        } catch (err) {
          // If we get an error, we've likely reached the end of the scholarships
          break;
        }
      }
      
      setTotalScholarships(count);
      setTotalFunded(funded);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchStats();
    }
  }, [account]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-32 ${className}`}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-900/20 border border-red-800 rounded-lg p-4 text-center ${className}`}>
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchStats}
          className="mt-2 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-1">Total Scholarships</h3>
        <p className="text-2xl font-bold">{totalScholarships}</p>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-1">Total Funded</h3>
        <p className="text-2xl font-bold">{formatUnits(totalFunded, 18)} USDT</p>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-1">Current Reward Rate</h3>
        <p className="text-2xl font-bold">{formatUnits(rewardRate, 18)} CIRQA per USDT</p>
      </div>
    </div>
  );
};

export default ScholarshipStats;