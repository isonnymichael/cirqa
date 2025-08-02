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
  
  // Determine total number of scholarships by finding the highest valid ID
  const [totalScholarships, setTotalScholarships] = useState<number>(0);
  const [isTotalScholarshipsLoading, setIsTotalScholarshipsLoading] = useState<boolean>(true);
  
  // Use useReadContract to fetch scholarships
  const fetchScholarshipData = (id: number) => {
    return useReadContract({
      contract: cirqaProtocolContract,
      method: 'scholarships',
      params: [id],
    });
  };
  
  // Create an array of scholarship IDs to fetch (1 to 20)
  const scholarshipIds = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => i + 1);
  }, []);
  
  // Fetch scholarship data for each ID
  const scholarshipDataResults = scholarshipIds.map(id => fetchScholarshipData(id));
  
  // Process scholarship data when available
  // useEffect(() => {
  //   if (account && scholarshipDataResults.every(result => !result.isLoading)) {
  //     const validScholarships: Scholarship[] = [];
      
  //     scholarshipDataResults.forEach((result, index) => {
  //       if (result.data && result.data.student !== '0x0000000000000000000000000000000000000000') {
  //         validScholarships.push({
  //           id: scholarshipIds[index],
  //           student: result.data.student,
  //           balance: result.data.balance,
  //           metadata: result.data.metadata,
  //           exists: true
  //         });
  //       }
  //     });
      
  //     setScholarships(validScholarships);
  //     setLoading(false);
  //   }
  // }, [account, scholarshipDataResults, scholarshipIds]);
  
  // Find the highest valid scholarship ID to determine total count
  // useEffect(() => {
  //   const findHighestScholarshipId = async () => {
  //     if (!account) return;
      
  //     setIsTotalScholarshipsLoading(true);
  //     try {
  //       let maxId = 0;
  //       const MAX_ID_TO_CHECK = 100; // Limit our search to avoid excessive calls
        
  //       for (let i = 1; i <= MAX_ID_TO_CHECK; i++) {
  //         try {
  //           // Check if the token exists by trying to get its owner
  //           const owner = await cirqaProtocolContract.read.ownerOf([i]);
  //           if (owner && owner !== '0x0000000000000000000000000000000000000000') {
  //             maxId = i;
  //           }
  //         } catch (err) {
  //           // If ownerOf throws an error, the token doesn't exist
  //           break;
  //         }
  //       }
        
  //       setTotalScholarships(maxId);
  //     } catch (err) {
  //       console.error('Error finding highest scholarship ID:', err);
  //     } finally {
  //       setIsTotalScholarshipsLoading(false);
  //     }
  //   };
    
  //   findHighestScholarshipId();
  // }, [account]);


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
    // Force a refresh by setting loading to true
    setLoading(true);
    // The data will be refreshed automatically by the useReadContract hooks
  };

  const handleWithdrawComplete = () => {
    setIsWithdrawModalOpen(false);
    // Force a refresh by setting loading to true
    setLoading(true);
    // The data will be refreshed automatically by the useReadContract hooks
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
          onClick={()=>{}} //{fetchScholarships}
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
      
      <div className="">
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
                    disabled={scholarship.balance <= BigInt(0)}
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