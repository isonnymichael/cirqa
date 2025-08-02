'use client';

import React, { useState } from 'react';

export type FilterOptions = {
  showOwned: boolean;
  minBalance: string;
  sortBy: 'id' | 'balance';
  sortOrder: 'asc' | 'desc';
};

type ScholarshipFilterProps = {
  onFilterChange: (filters: FilterOptions) => void;
  className?: string;
};

const ScholarshipFilter: React.FC<ScholarshipFilterProps> = ({ 
  onFilterChange,
  className = ''
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    showOwned: false,
    minBalance: '0',
    sortBy: 'id',
    sortOrder: 'asc'
  });

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`}>
      <h3 className="text-sm font-medium mb-3">Filter Scholarships</h3>
      
      <div className="space-y-4">
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showOwned}
              onChange={(e) => handleFilterChange('showOwned', e.target.checked)}
              className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-600 bg-gray-700"
            />
            <span className="text-sm">Show only my scholarships</span>
          </label>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Minimum Balance (USDT)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={filters.minBalance}
            onChange={(e) => handleFilterChange('minBalance', e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">Sort By</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleFilterChange('sortBy', 'id')}
              className={`px-3 py-1.5 text-sm rounded ${filters.sortBy === 'id' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              ID
            </button>
            <button
              onClick={() => handleFilterChange('sortBy', 'balance')}
              className={`px-3 py-1.5 text-sm rounded ${filters.sortBy === 'balance' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Balance
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Sort Order</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleFilterChange('sortOrder', 'asc')}
              className={`px-3 py-1.5 text-sm rounded ${filters.sortOrder === 'asc' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Ascending
            </button>
            <button
              onClick={() => handleFilterChange('sortOrder', 'desc')}
              className={`px-3 py-1.5 text-sm rounded ${filters.sortOrder === 'desc' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Descending
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipFilter;