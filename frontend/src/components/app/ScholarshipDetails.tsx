'use client';

import React, { useEffect, useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { 
  getScholarshipMetadata,
  getScholarshipOwner,
  hasEnoughBalance,
  getWithdrawalHistory,
  getScholarshipScore,
  formatCurrency,
  formatAddress,
  handleContractError,
  retryWithBackoff
} from '@/helper';
import Spinner from '@/app/Spinner';

type ScholarshipDetailsProps = {
  scholarshipId: number;
  onClose: () => void;
};

type ScholarshipData = {
  id: number;
  student: string;
  balance: bigint;
  metadata: string;
  score: bigint;
  withdrawalHistory: {
    amounts: bigint[];
    timestamps: bigint[];
  };
  totalWithdrawn: bigint;
  exists: boolean;
};

const ScholarshipDetails: React.FC<ScholarshipDetailsProps> = ({ scholarshipId, onClose }) => {
  const [scholarship, setScholarship] = useState<ScholarshipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const account = useActiveAccount();

  const fetchScholarshipData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all scholarship data in parallel
      const [metadata, owner, withdrawalHistory, score] = await Promise.all([
        retryWithBackoff(() => getScholarshipMetadata(scholarshipId)),
        retryWithBackoff(() => getScholarshipOwner(scholarshipId)),
        retryWithBackoff(() => getWithdrawalHistory(scholarshipId)),
        retryWithBackoff(() => getScholarshipScore(scholarshipId)).catch(() => BigInt(0)) // Score might not exist
      ]);

      // Calculate total withdrawn
      const totalWithdrawn = withdrawalHistory.amounts.reduce((sum, amount) => sum + amount, BigInt(0));

      // For now, we'll simulate balance check since we need the actual balance from contract
      // In a real implementation, you'd get this from the contract state
      const mockBalance = BigInt(0); // This should come from contract

      setScholarship({
        id: scholarshipId,
        student: owner,
        balance: mockBalance,
        metadata,
        score,
        withdrawalHistory,
        totalWithdrawn,
        exists: true
      });

    } catch (err: any) {
      console.error('Error fetching scholarship details:', err);
      const errorMessage = handleContractError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scholarshipId) {
      fetchScholarshipData();
    }
  }, [scholarshipId]);

  const handleRetry = () => {
    fetchScholarshipData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-gray-400 mt-4">Loading scholarship details...</p>
        </div>
      </div>
    );
  }

  if (error || !scholarship) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-center">
        <div className="text-red-500 text-xl mb-2">⚠</div>
        <p className="text-red-400 mb-4">{error || 'Scholarship not found'}</p>
        <div className="flex justify-center mt-4 space-x-3">
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
          >
            Try Again
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const isOwner = account?.address.toLowerCase() === scholarship.student.toLowerCase();

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold">Scholarship #{scholarship.id}</h2>
          <p className="text-gray-400">Detailed information and activity</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full">
            {isOwner ? 'Your Scholarship' : 'Investor View'}
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Basic Information */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">📋 Basic Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Student Address</p>
              <p className="font-mono text-sm">{formatAddress(scholarship.student, 10, 10)}</p>
              <p className="text-xs text-gray-500 mt-1">Full: {scholarship.student}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Metadata (IPFS Hash)</p>
              <p className="text-sm break-all bg-gray-800 p-2 rounded font-mono">
                {scholarship.metadata}
              </p>
            </div>

            {scholarship.score > BigInt(0) && (
              <div>
                <p className="text-sm text-gray-400">Scholarship Score</p>
                <p className="text-lg font-semibold text-yellow-400">
                  {scholarship.score.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Financial Summary */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">💰 Financial Summary</h3>
          <div className="space-y-3">
            <div className="bg-blue-900/20 p-3 rounded-lg">
              <p className="text-sm text-gray-400">Current Balance</p>
              <p className="text-2xl font-bold text-blue-400">
                {formatCurrency(scholarship.balance, 6, 'USDT ', 2)}
              </p>
            </div>
            
            <div className="bg-green-900/20 p-3 rounded-lg">
              <p className="text-sm text-gray-400">Total Withdrawn</p>
              <p className="text-xl font-semibold text-green-400">
                {formatCurrency(scholarship.totalWithdrawn, 6, 'USDT ', 2)}
              </p>
            </div>

            <div className="bg-purple-900/20 p-3 rounded-lg">
              <p className="text-sm text-gray-400">Total Funded</p>
              <p className="text-xl font-semibold text-purple-400">
                {formatCurrency(scholarship.balance + scholarship.totalWithdrawn, 6, 'USDT ', 2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="bg-gray-700/30 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">📈 Withdrawal History</h3>
        
        {scholarship.withdrawalHistory.amounts.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p>No withdrawals yet</p>
            {isOwner && (
              <p className="text-sm mt-1">Funds will appear here when you make withdrawals</p>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {scholarship.withdrawalHistory.amounts.map((amount, index) => {
              const timestamp = scholarship.withdrawalHistory.timestamps[index];
              const date = new Date(Number(timestamp) * 1000);
              
              return (
                <div key={index} className="flex justify-between items-center bg-gray-800 p-3 rounded">
                  <div>
                    <p className="font-semibold">
                      {formatCurrency(amount, 6, 'USDT ', 2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {date.toLocaleDateString()} {date.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                      Withdrawal #{index + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Close
        </button>
        
        {/* You could add Fund/Withdraw buttons here that trigger the respective modals */}
      </div>
    </div>
  );
};

export default ScholarshipDetails;