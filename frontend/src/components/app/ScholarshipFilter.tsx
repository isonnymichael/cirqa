'use client';

import React, { useState } from 'react';

export type FilterOptions = {
  showOwned: boolean;
  minBalance: string;
  minScore: string;
  sortBy: 'id' | 'balance' | 'score';
  sortOrder: 'asc' | 'desc';
};

type ScholarshipFilterProps = {
  onFilterChange: (filters: FilterOptions) => void;
  onRefresh?: () => void;
  className?: string;
};

const ScholarshipFilter: React.FC<ScholarshipFilterProps> = ({ 
  onFilterChange,
  onRefresh,
  className = ''
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    showOwned: false,
    minBalance: '0',
    minScore: '0',
    sortBy: 'id',
    sortOrder: 'desc'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      // Reset filters first
      const defaultFilters = {
        showOwned: false,
        minBalance: '0',
        minScore: '0',
        sortBy: 'id' as const,
        sortOrder: 'desc' as const
      };
      setFilters(defaultFilters);
      onFilterChange(defaultFilters);
      
      // Then refresh the data
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing scholarships:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className={`bg-gray-800 rounded border border-gray-700 p-2 ${className}`}>
      {/* Compact horizontal layout */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        
        {/* Filter title with icon */}
        <div className="flex items-center text-gray-300 font-medium">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          Filter:
        </div>

        {/* Show owned checkbox */}
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={filters.showOwned}
            onChange={(e) => handleFilterChange('showOwned', e.target.checked)}
            className="cursor-pointer w-3 h-3 text-blue-600 rounded border-gray-600 bg-gray-700 focus:ring-1 focus:ring-blue-500 mr-1"
          />
          <span className="text-gray-300">Mine</span>
        </label>

        {/* Minimum balance input */}
        <div className="flex items-center">
          <span className="text-gray-400 mr-1">Min:</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={filters.minBalance}
            onChange={(e) => handleFilterChange('minBalance', e.target.value)}
            className="cursor-pointer w-16 bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
          <span className="text-gray-500 ml-1 text-xs">Funded</span>
        </div>

        {/* Minimum score input */}
        <div className="flex items-center">
          <span className="text-gray-400 mr-1">Min:</span>
          <input
            type="number"
            min="0"
            step="1"
            value={filters.minScore}
            onChange={(e) => handleFilterChange('minScore', e.target.value)}
            className="cursor-pointer w-14 bg-gray-700 border border-gray-600 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
          />
          <span className="text-gray-500 ml-1 text-xs">Score</span>
        </div>

        {/* Divider */}
        <div className="h-3 w-px bg-gray-600"></div>

        {/* Sort by buttons */}
        <div className="flex items-center">
          <span className="text-gray-400 mr-1">Sort:</span>
          <div className="flex">
            <button
              onClick={() => handleFilterChange('sortBy', 'id')}
              className={`cursor-pointer px-2 py-0.5 text-xs rounded-l border-r border-gray-600 ${
                filters.sortBy === 'id' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              } transition-colors`}
            >
              ID
            </button>
            <button
              onClick={() => handleFilterChange('sortBy', 'balance')}
              className={`cursor-pointer px-2 py-0.5 text-xs border-r border-gray-600 ${
                filters.sortBy === 'balance' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              } transition-colors`}
            >
              Funded
            </button>
            <button
              onClick={() => handleFilterChange('sortBy', 'score')}
              className={`cursor-pointer px-2 py-0.5 text-xs rounded-r ${
                filters.sortBy === 'score' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              } transition-colors`}
            >
              Score
            </button>
          </div>
        </div>

        {/* Sort order buttons */}
        <div className="flex">
          <button
            onClick={() => handleFilterChange('sortOrder', 'asc')}
            className={`cursor-pointer p-1 rounded-l ${
              filters.sortOrder === 'asc' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-400'
            } transition-colors`}
            title="Ascending"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => handleFilterChange('sortOrder', 'desc')}
            className={`cursor-pointer p-1 rounded-r border-l border-gray-600 ${
              filters.sortOrder === 'desc' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-400'
            } transition-colors`}
            title="Descending"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`cursor-pointer ml-auto text-gray-400 hover:text-gray-300 transition-colors flex items-center space-x-1 ${
            isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Reset filters & refresh scholarships"
        >
          {isRefreshing ? (
            <>
              <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">Refreshing...</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">Refresh</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ScholarshipFilter;