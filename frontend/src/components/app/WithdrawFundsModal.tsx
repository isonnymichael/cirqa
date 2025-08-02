'use client';

import React, { useState } from 'react';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import { cirqaProtocolContract } from '@/lib/contracts';
import { formatUnits, parseUnits } from 'ethers';
import Spinner from '@/app/Spinner';

type Scholarship = {
  id: number;
  student: string;
  balance: bigint;
  metadata: string;
  exists: boolean;
};

type WithdrawFundsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onWithdrawComplete: () => void;
  scholarship: Scholarship;
};

const WithdrawFundsModal: React.FC<WithdrawFundsModalProps> = ({
  isOpen,
  onClose,
  onWithdrawComplete,
  scholarship,
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const account = useActiveAccount();
  const { mutate: sendTransaction, isPending, isError, error: txError } = useSendTransaction();

  const maxBalance = formatUnits(scholarship.balance, 18);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleMaxClick = () => {
    setAmount(maxBalance);
    setError(null);
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

      // Check if amount is greater than balance
      if (parseFloat(amount) > parseFloat(maxBalance)) {
        setError('Amount exceeds available balance');
        setIsLoading(false);
        return;
      }

      // Convert amount to wei (18 decimals for USDT)
      const amountInWei = parseUnits(amount, 18);

      // Prepare withdraw transaction
      const withdrawTx = await cirqaProtocolContract.prepare.withdrawFunds([
        scholarship.id,
        amountInWei,
      ]);

      // Send withdraw transaction
      sendTransaction(withdrawTx, {
        onSuccess: async (result) => {
          try {
            await result.wait();
            setIsSuccess(true);
            setTimeout(() => {
              onWithdrawComplete();
              setIsSuccess(false);
              setAmount('');
            }, 2000);
          } catch (err: any) {
            console.error('Error waiting for withdraw transaction:', err);
            setError(err.message || 'Failed to withdraw funds');
          } finally {
            setIsLoading(false);
          }
        },
        onError: (err: any) => {
          console.error('Withdraw transaction error:', err);
          setError(err.message || 'Failed to withdraw funds');
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

  // Check if user is the scholarship owner
  const isOwner = account?.address.toLowerCase() === scholarship.student.toLowerCase();
  if (!isOwner) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
          <h2 className="text-xl font-bold mb-4">Withdraw Funds</h2>
          <div className="text-center py-6">
            <div className="text-red-500 text-xl mb-2">✗</div>
            <p className="text-red-400 font-medium">Only the scholarship owner can withdraw funds.</p>
          </div>
          <div className="flex justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Withdraw Funds from Scholarship #{scholarship.id}</h2>
        
        {isSuccess ? (
          <div className="text-center py-6">
            <div className="text-green-500 text-xl mb-2">✓</div>
            <p className="text-green-400 font-medium">Funds withdrawn successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
                  Amount (USDT)
                </label>
                <span className="text-xs text-gray-400">
                  Available: {maxBalance} USDT
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white pr-16"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-gray-600 px-2 py-1 rounded text-gray-300 hover:bg-gray-500 transition-colors"
                  onClick={handleMaxClick}
                  disabled={isLoading}
                >
                  MAX
                </button>
              </div>
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
                className="px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center min-w-[80px]"
                disabled={isLoading || scholarship.balance <= BigInt(0)}
              >
                {isLoading ? <Spinner size="sm" /> : 'Withdraw'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WithdrawFundsModal;