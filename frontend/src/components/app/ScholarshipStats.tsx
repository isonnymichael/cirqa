'use client';

import React, { useState, useEffect } from 'react';
import { FaGraduationCap, FaDollarSign, FaUsers, FaChartLine } from 'react-icons/fa';
import { 
  getAllScholarships,
  getScholarshipData,
  formatCurrency,
  handleContractError,
  retryWithBackoff
} from '@/helper';
import Spinner from '@/app/Spinner';

type ScholarshipStatsProps = {
  className?: string;
};

type ScholarshipMetrics = {
  totalScholarships: number;
  totalFundingAmount: bigint;
  totalWithdrawals: bigint;
  activeScholarships: number;
  studentsCount: number;
  isLoading: boolean;
  error: string | null;
};

const ScholarshipStats: React.FC<ScholarshipStatsProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<ScholarshipMetrics>({
    totalScholarships: 0,
    totalFundingAmount: BigInt(0),
    totalWithdrawals: BigInt(0),
    activeScholarships: 0,
    studentsCount: 0,
    isLoading: true,
    error: null
  });

  const fetchMetrics = async () => {
    setMetrics(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get all scholarship IDs
      const scholarshipIds = await retryWithBackoff(() => getAllScholarships());
      
      if (scholarshipIds.length === 0) {
        setMetrics({
          totalScholarships: 0,
          totalFundingAmount: BigInt(0),
          totalWithdrawals: BigInt(0),
          activeScholarships: 0,
          studentsCount: 0,
          isLoading: false,
          error: null
        });
        return;
      }

      // Fetch scholarship data for all scholarships
      const scholarshipDataPromises = scholarshipIds.map(id => 
        retryWithBackoff(() => getScholarshipData(id)).catch(err => {
          console.error(`Error fetching data for scholarship ${id}:`, err);
          return null;
        })
      );

      const scholarshipDataResults = await Promise.all(scholarshipDataPromises);
      const validScholarshipData = scholarshipDataResults.filter(data => data !== null);

      // Calculate metrics from real data
      let totalFunding = BigInt(0);
      let totalWithdrawn = BigInt(0);
      let activeCount = 0;
      const uniqueStudents = new Set<string>();

      validScholarshipData.forEach(data => {
        if (data) {
          totalFunding += data.totalFunded;
          totalWithdrawn += data.totalWithdrawn;
          
          // Count as active if has balance > 0
          if (data.balance > BigInt(0)) {
            activeCount++;
          }
          
          // Add student to unique set
          uniqueStudents.add(data.student.toLowerCase());
        }
      });

      setMetrics({
        totalScholarships: scholarshipIds.length,
        totalFundingAmount: totalFunding,
        totalWithdrawals: totalWithdrawn,
        activeScholarships: activeCount,
        studentsCount: uniqueStudents.size,
        isLoading: false,
        error: null
      });

    } catch (err: any) {
      console.error('Error fetching scholarship metrics:', err);
      const errorMessage = handleContractError(err);
      setMetrics(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRetry = () => {
    fetchMetrics();
  };

  if (metrics.error) {
    return (
      <div className={`bg-red-900/20 border border-red-800 rounded-md p-2 text-center ${className}`}>
        <p className="text-red-400 text-xs mb-1">Failed to load statistics</p>
        <button 
          onClick={handleRetry}
          className="px-2 py-1 bg-red-700 text-white rounded text-xs hover:bg-red-800 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-3 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium flex items-center">
          <FaChartLine className="mr-1 text-blue-400 text-xs" />
          Statistics
        </h2>
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {/* Total Scholarships */}
        <div className="bg-blue-900/20 rounded p-2 text-center">
          <FaGraduationCap className="text-blue-400 text-xs mx-auto mb-1" />
          <div className="text-sm font-bold text-blue-400">
            {metrics.isLoading ? <Spinner size="sm" /> : metrics.totalScholarships}
          </div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        
        {/* Total Funding */}
        <div className="bg-green-900/20 rounded p-2 text-center">
          <FaDollarSign className="text-green-400 text-xs mx-auto mb-1" />
          <div className="text-sm font-bold text-green-400">
            {metrics.isLoading ? <Spinner size="sm" /> : formatCurrency(metrics.totalFundingAmount, 6, '', 0)}
          </div>
          <div className="text-xs text-gray-500">Funded</div>
        </div>
        
        {/* Active Scholarships */}
        <div className="bg-purple-900/20 rounded p-2 text-center">
          <FaChartLine className="text-purple-400 text-xs mx-auto mb-1" />
          <div className="text-sm font-bold text-purple-400">
            {metrics.isLoading ? <Spinner size="sm" /> : metrics.activeScholarships}
          </div>
          <div className="text-xs text-gray-500">Active</div>
        </div>
        
        {/* Unique Students */}
        <div className="bg-orange-900/20 rounded p-2 text-center">
          <FaUsers className="text-orange-400 text-xs mx-auto mb-1" />
          <div className="text-sm font-bold text-orange-400">
            {metrics.isLoading ? <Spinner size="sm" /> : metrics.studentsCount}
          </div>
          <div className="text-xs text-gray-500">Students</div>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-yellow-900/20 rounded p-2 text-center">
          <FaDollarSign className="text-yellow-400 text-xs mx-auto mb-1" />
          <div className="text-sm font-bold text-yellow-400">
            {metrics.isLoading ? <Spinner size="sm" /> : formatCurrency(metrics.totalWithdrawals, 6, '', 0)}
          </div>
          <div className="text-xs text-gray-500">Withdrawn</div>
        </div>
        
        {/* Available Balance */}
        <div className="bg-emerald-900/20 rounded p-2 text-center">
          <FaDollarSign className="text-emerald-400 text-xs mx-auto mb-1" />
          <div className="text-sm font-bold text-emerald-400">
            {metrics.isLoading ? <Spinner size="sm" /> : formatCurrency(metrics.totalFundingAmount - metrics.totalWithdrawals, 6, '', 0)}
          </div>
          <div className="text-xs text-gray-500">Available</div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipStats;