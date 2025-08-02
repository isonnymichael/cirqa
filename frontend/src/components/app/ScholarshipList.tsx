'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { cirqaProtocolContract } from '@/lib/contracts';
import { formatUnits } from 'ethers';
import FundScholarshipModal from './FundScholarshipModal';
import WithdrawFundsModal from './WithdrawFundsModal';
import ScholarshipFilter, { FilterOptions } from './ScholarshipFilter';
import Spinner from '@/app/Spinner';

type Scholarship = {
  id: number;
  student: string;
  balance: bigint;
  metadata: string;
  exists: boolean;
};

const ScholarshipList: React.FC = () => {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    showOwned: false,
    minBalance: '0',
    sortBy: 'id',
    sortOrder: 'asc'
  });
  
  const account = useActiveAccount();

  // Function to fetch a single scholarship by ID
  const fetchScholarship = async (id: number): Promise<Scholarship | null> => {
    try {
      const result = await cirqaProtocolContract.read.scholarships([id]);
      if (result && result.exists) {
        return {
          id,
          student: result.student,
          balance: result.balance,
          metadata: result.metadata,
          exists: result.exists
        };
      }
      return null;
    } catch (err) {
      console.error(`Error fetching scholarship ${id}:`, err);
      return null;
    }
  };

  // Function to fetch all scholarships
  const fetchScholarships = async () => {
    setLoading(true);
    setError(null);
    try {
      // We'll try to fetch scholarships with IDs from 1 to 20 (adjust as needed)
      const scholarshipPromises = [];
      for (let i = 1; i <= 20; i++) {
        scholarshipPromises.push(fetchScholarship(i));
      }

      const results = await Promise.all(scholarshipPromises);
      const validScholarships = results.filter(s => s !== null) as Scholarship[];
      setScholarships(validScholarships);
    } catch (err: any) {
      console.error('Error fetching scholarships:', err);
      setError(err.message || 'Failed to load scholarships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      fetchScholarships();
    }
  }, [account]);

  const handleFundClick = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setIsFundModalOpen(true);
  };

  const handleWithdrawClick = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
    setIsWithdrawModalOpen(true);
  };

  const handleFundComplete = () => {
    setIsFundModalOpen(false);
    fetchScholarships(); // Refresh the list
  };

  const handleWithdrawComplete = () => {
    setIsWithdrawModalOpen(false);
    fetchScholarships(); // Refresh the list
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-center">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchScholarships}
          className="mt-2 px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (scholarships.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
        <p className="text-gray-400 mb-4">No scholarships found.</p>
      </div>
    );
  }

  // Apply filters to scholarships
  const filteredScholarships = useMemo(() => {
    let result = [...scholarships];
    
    // Filter by ownership if needed
    if (filters.showOwned && account) {
      result = result.filter(s => 
        s.student.toLowerCase() === account.address.toLowerCase()
      );
    }
    
    // Filter by minimum balance
    const minBalanceWei = parseFloat(filters.minBalance) * 1e18; // Convert to Wei equivalent
    result = result.filter(s => 
      parseFloat(s.balance.toString()) >= minBalanceWei
    );
    
    // Sort the results
    result.sort((a, b) => {
      if (filters.sortBy === 'id') {
        return filters.sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
      } else { // balance
        const balanceA = parseFloat(a.balance.toString());
        const balanceB = parseFloat(b.balance.toString());
        return filters.sortOrder === 'asc' ? balanceA - balanceB : balanceB - balanceA;
      }
    });
    
    return result;
  }, [scholarships, filters, account]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <div>
      <div className="mb-4">
        <ScholarshipFilter onFilterChange={handleFilterChange} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScholarships.map((scholarship) => {
          const isOwner = account?.address.toLowerCase() === scholarship.student.toLowerCase();
          
          return (
            <div key={scholarship.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">Scholarship #{scholarship.id}</h3>
                <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                  {isOwner ? 'Your Scholarship' : 'Investor View'}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-400">Student: {scholarship.student.slice(0, 6)}...{scholarship.student.slice(-4)}</p>
                <p className="text-sm text-gray-400">Metadata: {scholarship.metadata}</p>
                <p className="text-lg font-medium mt-2">
                  Balance: {formatUnits(scholarship.balance, 18)} USDT
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleFundClick(scholarship)}
                  className="flex-1 px-3 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors text-sm"
                >
                  Fund
                </button>
                
                {isOwner && (
                  <button
                    onClick={() => handleWithdrawClick(scholarship)}
                    className="flex-1 px-3 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors text-sm"
                    disabled={scholarship.balance <= 0n}
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedScholarship && (
        <>
          <FundScholarshipModal
            isOpen={isFundModalOpen}
            onClose={() => setIsFundModalOpen(false)}
            onFundComplete={handleFundComplete}
            scholarship={selectedScholarship}
          />
          
          <WithdrawFundsModal
            isOpen={isWithdrawModalOpen}
            onClose={() => setIsWithdrawModalOpen(false)}
            onWithdrawComplete={handleWithdrawComplete}
            scholarship={selectedScholarship}
          />
        </>
      )}
    </div>
  );
};

export default ScholarshipList;