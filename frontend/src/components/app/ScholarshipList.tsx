'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { 
  getAllScholarships, 
  getScholarshipsByStudent, 
  getScholarshipMetadata,
  getScholarshipOwner,
  formatCurrency,
  formatAddress,
  handleContractError,
  retryWithBackoff
} from '@/helper';
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
  const [loading, setLoading] = useState(false);
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

  // Fetch scholarships data
  const fetchScholarships = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get all scholarship IDs
      const scholarshipIds = await retryWithBackoff(() => getAllScholarships());
      
      if (scholarshipIds.length === 0) {
        setScholarships([]);
        setLoading(false);
        return;
      }

      // Fetch details for each scholarship
      const scholarshipDetails = await Promise.all(
        scholarshipIds.map(async (id) => {
          try {
            const [metadata, owner] = await Promise.all([
              getScholarshipMetadata(id),
              getScholarshipOwner(id)
            ]);

            return {
              id,
              student: owner,
              balance: BigInt(0), // Will be updated with real balance from contract
              metadata,
              exists: true
            };
          } catch (err) {
            console.error(`Error fetching scholarship ${id}:`, err);
            return null;
          }
        })
      );

      // Filter out null results and update state
      const validScholarships = scholarshipDetails.filter((s): s is Scholarship => s !== null);
      setScholarships(validScholarships);

    } catch (err: any) {
      console.error('Error fetching scholarships:', err);
      const errorMessage = handleContractError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts or account changes
  useEffect(() => {
    fetchScholarships();
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
    // Refresh scholarship data
    fetchScholarships();
  };

  const handleWithdrawComplete = () => {
    setIsWithdrawModalOpen(false);
    // Refresh scholarship data
    fetchScholarships();
  };

  const handleRetry = () => {
    fetchScholarships();
  };

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
    const minBalanceWei = parseFloat(filters.minBalance) * 1e6; // USDT has 6 decimals
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-gray-400 mt-4">Loading scholarships...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-center">
        <div className="text-red-500 text-xl mb-2">⚠</div>
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={handleRetry}
          className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (scholarships.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
        <div className="text-gray-400 text-xl mb-2">📚</div>
        <p className="text-gray-400 mb-4">No scholarships found.</p>
        <p className="text-gray-500 text-sm">
          Be the first to create a scholarship or check back later.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Component */}
      <div className="mb-4">
        <ScholarshipFilter onFilterChange={handleFilterChange} />
      </div>
      
      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-400">
        Showing {filteredScholarships.length} of {scholarships.length} scholarships
      </div>
      
      {/* Scholarship Cards */}
      <div className="space-y-4">
        {filteredScholarships.map((scholarship) => {
          const isOwner = account?.address.toLowerCase() === scholarship.student.toLowerCase();
          
          return (
            <div key={scholarship.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">Scholarship #{scholarship.id}</h3>
                <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                  {isOwner ? 'Your Scholarship' : 'Available for Funding'}
                </span>
              </div>
              
              <div className="mb-4 space-y-2">
                <div>
                  <p className="text-sm text-gray-400">Student</p>
                  <p className="font-mono text-sm">{formatAddress(scholarship.student)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Metadata</p>
                  <p className="text-sm break-all">{scholarship.metadata}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400">Current Balance</p>
                  <p className="text-lg font-medium">
                    {formatCurrency(scholarship.balance, 6, 'USDT ', 2)}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleFundClick(scholarship)}
                  className="flex-1 px-3 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition-colors text-sm font-medium"
                  disabled={!account}
                >
                  💰 Fund
                </button>
                
                {isOwner && (
                  <button
                    onClick={() => handleWithdrawClick(scholarship)}
                    className="flex-1 px-3 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors text-sm font-medium"
                    disabled={scholarship.balance <= BigInt(0)}
                  >
                    💸 Withdraw
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
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