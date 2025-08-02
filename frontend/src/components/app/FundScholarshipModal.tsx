'use client';

import React, { useState } from 'react';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { cirqaProtocolContract } from '@/lib/contracts';
import { parseUnits } from 'ethers';
import Spinner from '@/app/Spinner';

type Scholarship = {
  id: number;
  student: string;
  balance: bigint;
  metadata: string;
  exists: boolean;
};

type FundScholarshipModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onFundComplete: () => void;
  scholarship: Scholarship;
};

const FundScholarshipModal: React.FC<FundScholarshipModalProps> = ({
  isOpen,
  onClose,
  onFundComplete,
  scholarship,
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending, isError, error: txError } = useSendTransaction();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate amount
      if (!amount || parseFloat(amount) <= 0) {
        setError('Please enter a valid amount');
        setIsLoading(false);
        return;
      }

      // Convert amount to wei (18 decimals for USDT)
      const amountInWei = parseUnits(amount, 18);

      // First, approve USDT spending
      const approvalTx = await cirqaProtocolContract.prepareApprove({
        spender: cirqaProtocolContract.address,
        amount: amountInWei,
      });

      // Send approval transaction
      sendTransaction(approvalTx, {
        onSuccess: async (result) => {
          try {
            // Wait for approval to be confirmed
            await result.wait();

            // Now fund the scholarship
            const fundTx = await cirqaProtocolContract.prepare.fundScholarship([
              scholarship.id,
              amountInWei,
            ]);

            // Send fund transaction
            sendTransaction(fundTx, {
              onSuccess: async (fundResult) => {
                try {
                  await fundResult.wait();
                  setIsSuccess(true);
                  setTimeout(() => {
                    onFundComplete();
                    setIsSuccess(false);
                    setAmount('');
                  }, 2000);
                } catch (err: any) {
                  console.error('Error waiting for fund transaction:', err);
                  setError(err.message || 'Failed to fund scholarship');
                } finally {
                  setIsLoading(false);
                }
              },
              onError: (err: any) => {
                console.error('Fund transaction error:', err);
                setError(err.message || 'Failed to fund scholarship');
                setIsLoading(false);
              },
            });
          } catch (err: any) {
            console.error('Error waiting for approval transaction:', err);
            setError(err.message || 'Failed to approve USDT');
            setIsLoading(false);
          }
        },
        onError: (err: any) => {
          console.error('Approval transaction error:', err);
          setError(err.message || 'Failed to approve USDT');
          setIsLoading(false);
        },
      });
    } catch (err: any) {
      console.error('Error preparing transaction:', err);
      setError(err.message || 'Failed to prepare transaction');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Fund Scholarship #{scholarship.id}</h2>
        
        {isSuccess ? (
          <div className="text-center py-6">
            <div className="text-green-500 text-xl mb-2">✓</div>
            <p className="text-green-400 font-medium">Scholarship funded successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">
                Amount (USDT)
              </label>
              <input
                type="text"
                id="amount"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-400 mt-1">
                Student: {scholarship.student.slice(0, 6)}...{scholarship.student.slice(-4)}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-900/30 border border-red-800 rounded-md">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center min-w-[80px]"
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : 'Fund'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FundScholarshipModal;