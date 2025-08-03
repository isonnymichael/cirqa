'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { 
  getAllScholarships, 
  getScholarshipsByStudent, 
  getScholarshipMetadata,
  getScholarshipOwner,
  getScholarshipScore,
  getScholarshipData,
  formatCurrency,
  formatAddress,
  handleContractError,
  retryWithBackoff,
  parseMetadata,
  fetchIpfsMetadata,
  convertIpfsToHttp,
  ParsedMetadata
} from '@/helper';
import ScholarshipFilter, { FilterOptions } from './ScholarshipFilter';
import ScholarshipDetails from './ScholarshipDetails';
import Spinner from '@/app/Spinner';

type Scholarship = {
  id: number;
  student: string;
  balance: bigint;
  metadata: string;
  score: bigint;
  exists: boolean;
};

type ScholarshipListProps = {
  onViewModeChange?: (isDetailView: boolean) => void;
  onRefreshStats?: () => void;
};

const ScholarshipList: React.FC<ScholarshipListProps> = ({ 
  onViewModeChange,
  onRefreshStats
}) => {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<number | null>(null);
  const [ipfsMetadataCache, setIpfsMetadataCache] = useState<Record<string, ParsedMetadata>>({});
  const [filters, setFilters] = useState<FilterOptions>({
    showOwned: false,
    minBalance: '0',
    minScore: '0',
    sortBy: 'id',
    sortOrder: 'asc'
  });
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  
  const account = useActiveAccount();
  
  // Utility function for blockchain update delay
  const waitForBlockchainUpdate = async (delayMs: number = 1500) => {
    console.log('⏳ Allowing time for blockchain data to propagate...');
    console.log(`⏰ List refresh delay duration: ${delayMs}ms`);
    setIsRefreshingData(true);
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    console.log('✅ Blockchain propagation wait completed');
    setIsRefreshingData(false);
  };
  
  // Get parsed metadata with IPFS support
  const getParsedMetadata = (metadataString: string, scholarshipId: number): ParsedMetadata => {
    const basicParsed = parseMetadata(metadataString);
    
    // If it's an IPFS URL that needs fetching
    if (basicParsed.ipfsUrl) {
      // Check cache first
      const cached = ipfsMetadataCache[basicParsed.ipfsUrl];
      if (cached) {
        return cached;
      }
      
      // Trigger async fetch (fire and forget)
      fetchIpfsMetadata(basicParsed.ipfsUrl, scholarshipId).then(fetchedMetadata => {
        setIpfsMetadataCache(prev => ({
          ...prev,
          [basicParsed.ipfsUrl!]: fetchedMetadata
        }));
      });
      
      // Return loading state for now
      return basicParsed;
    }
    
    return basicParsed;
  };

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
            const [scholarshipData, score] = await Promise.all([
              retryWithBackoff(() => getScholarshipData(id)),
              retryWithBackoff(() => getScholarshipScore(id)).catch((err) => {
                console.log(`Score not available for scholarship ${id}:`, err);
                return BigInt(0);
              })
            ]);

            return {
              id,
              student: scholarshipData.student,
              balance: scholarshipData.balance, // Real balance from contract
              metadata: scholarshipData.metadata,
              score: score || BigInt(0), // Ensure score is never undefined
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

  // Force re-render when IPFS metadata cache updates
  useEffect(() => {
    // This will trigger a re-render of the component when IPFS metadata is loaded
    // No additional logic needed, just the dependency will cause re-render
  }, [ipfsMetadataCache]);

  // Notify parent about initial view mode
  useEffect(() => {
    onViewModeChange?.(selectedScholarshipId !== null);
  }, [selectedScholarshipId, onViewModeChange]);

  const handleScholarshipClick = (scholarshipId: number) => {
    setSelectedScholarshipId(scholarshipId);
    // Notify parent that we're entering detail view
    onViewModeChange?.(true);
  };

  const handleBackToList = async () => {
    setSelectedScholarshipId(null);
    // Notify parent that we're returning to list view
    onViewModeChange?.(false);
    
    // Refresh data when returning from details (user might have performed operations)
    console.log('🔄 Refreshing list after returning from details...');
    await refreshScholarshipsWithDelay();
    
    // Also refresh global statistics
    console.log('📊 Refreshing global statistics...');
    onRefreshStats?.();
  };

  const handleRetry = () => {
    fetchScholarships();
  };

  // Enhanced refresh function with blockchain delay
  const refreshScholarshipsWithDelay = async () => {
    await waitForBlockchainUpdate();
    await fetchScholarships();
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
    
    // Filter by minimum score
    if (filters.minScore && parseInt(filters.minScore) > 0) {
      const minScoreValue = parseInt(filters.minScore) * 100; // Convert to contract format (2 decimal precision)
      result = result.filter(s => {
        const scoreValue = s.score ? Number(s.score) : 0;
        return scoreValue >= minScoreValue;
      });
    }
    
    // Sort the results
    result.sort((a, b) => {
      if (filters.sortBy === 'id') {
        return filters.sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
      } else if (filters.sortBy === 'balance') {
        const balanceA = parseFloat(a.balance.toString());
        const balanceB = parseFloat(b.balance.toString());
        return filters.sortOrder === 'asc' ? balanceA - balanceB : balanceB - balanceA;
      } else { // score
        const scoreA = a.score ? Number(a.score) : 0;
        const scoreB = b.score ? Number(b.score) : 0;
        return filters.sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }
    });
    
    return result;
  }, [scholarships, filters, account]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  // Show scholarship detail view
  if (selectedScholarshipId !== null) {
    return (
      <div>
        <button
          onClick={handleBackToList}
          className="cursor-pointer mb-4 flex items-center text-blue-400 hover:text-blue-300 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Scholarships
        </button>
        <ScholarshipDetails scholarshipId={selectedScholarshipId} onClose={handleBackToList} />
      </div>
    );
  }

  if (loading || isRefreshingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-gray-400 mt-4">
            {isRefreshingData ? 'Refreshing scholarship data...' : 'Loading scholarships...'}
          </p>
          {isRefreshingData && (
            <p className="text-yellow-400 text-sm mt-2">⏳ Waiting for latest blockchain data</p>
          )}
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
        <ScholarshipFilter 
          onFilterChange={handleFilterChange} 
          onRefresh={refreshScholarshipsWithDelay}
        />
      </div>
      
      {/* Results Summary */}
      <div className="mb-4 text-sm text-gray-400">
        Showing {filteredScholarships.length} of {scholarships.length} scholarships
      </div>
      
      {/* Scholarship Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4 md:mb-0">
        {filteredScholarships.map((scholarship) => {
          const metadata = getParsedMetadata(scholarship.metadata, scholarship.id);
          const isOwner = account?.address.toLowerCase() === scholarship.student.toLowerCase();
          
          return (
            <div 
              key={scholarship.id} 
              onClick={() => handleScholarshipClick(scholarship.id)}
              className="bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 hover:shadow-lg transition-all duration-200 cursor-pointer group overflow-hidden"
            >
              {/* Scholarship Image */}
              <div className="relative h-48 bg-gray-700">
                {metadata.image ? (
                  <img
                    src={metadata.image}
                    alt={metadata.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center bg-gray-700 ${metadata.image ? 'hidden' : ''}`}>
                  <div className="text-center text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-xs">No Image</p>
                  </div>
                </div>
                
                {/* Overlay badges */}
                <div className="absolute top-2 left-2">
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    #{scholarship.id}
                </span>
              </div>
              
                <div className="absolute top-2 right-2">
                  {isOwner ? (
                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                      Mine
                    </span>
                  ) : (
                    <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded">
                      Available
                    </span>
                  )}
                </div>
              </div>
              
              {/* Scholarship Info */}
              <div className="p-3 space-y-2">
                {/* Title */}
                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors overflow-hidden" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {metadata.name}
                </h3>
                
                {/* Student */}
                <p className="text-xs text-gray-400 font-mono">
                  {formatAddress(scholarship.student)}
                </p>
                
                {/* Stats */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Balance</p>
                    <p className="text-sm font-medium text-green-400">
                      {formatCurrency(scholarship.balance, 6, '', 0)}
                    </p>
                    <p className="text-xs text-gray-500">USDT</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Score</p>
                    <p className="text-sm font-medium text-yellow-400">
                      {scholarship.score ? (Number(scholarship.score) / 100).toFixed(1) : '0.0'}
                    </p>
                    <p className="text-xs text-gray-500">⭐ Rating</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScholarshipList;
