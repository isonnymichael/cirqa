'use client';

import React, { useEffect, useState } from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { cirqaProtocolContract } from '@/lib/contracts';
import { formatUnits } from 'ethers';
import Spinner from '@/app/Spinner';

type ScholarshipDetailsProps = {
  scholarshipId: number;
  onClose: () => void;
};

type Scholarship = {
  id: number;
  student: string;
  balance: bigint;
  metadata: string;
  exists: boolean;
};

const ScholarshipDetails: React.FC<ScholarshipDetailsProps> = ({ scholarshipId, onClose }) => {
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const account = useActiveAccount();

  const fetchScholarship = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await cirqaProtocolContract.read.scholarships([scholarshipId]);
      if (result && result.exists) {
        setScholarship({
          id: scholarshipId,
          student: result.student,
          balance: result.balance,
          metadata: result.metadata,
          exists: result.exists
        });
      } else {
        setError('Scholarship not found');
      }
    } catch (err: any) {
      console.error('Error fetching scholarship:', err);
      setError(err.message || 'Failed to load scholarship details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scholarshipId) {
      fetchScholarship();
    }
  }, [scholarshipId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !scholarship) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-center">
        <p className="text-red-500">{error || 'Scholarship not found'}</p>
        <div className="flex justify-center mt-4 space-x-3">
          <button 
            onClick={fetchScholarship}
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
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold">Scholarship #{scholarship.id}</h2>
        <span className="text-sm bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full">
          {isOwner ? 'Your Scholarship' : 'Investor View'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Details</h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-400">Student Address</p>
              <p className="font-mono">{scholarship.student}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Metadata</p>
              <p className="break-all">{scholarship.metadata}</p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-3">Financial Information</h3>
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400">Current Balance</p>
            <p className="text-2xl font-bold">{formatUnits(scholarship.balance, 18)} USDT</p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ScholarshipDetails;