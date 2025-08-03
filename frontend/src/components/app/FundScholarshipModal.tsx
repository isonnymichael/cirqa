'use client';

import React, { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { 
  fundScholarship, 
  parseTokenAmount, 
  getUSDTBalance, 
  getUSDTAllowance,
  formatCurrency,
  handleContractError,
  isValidAmount 
} from '@/helper';
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
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [loadingBalance, setLoadingBalance] = useState(false);
  
  const account = useActiveAccount();

  // Load user balance and allowance when modal opens
  useEffect(() => {
    if (isOpen && account?.address) {
      loadUserData();
    }
  }, [isOpen, account?.address]);

  const loadUserData = async () => {
    if (!account?.address) return;
    
    setLoadingBalance(true);
    try {
      const [balance, currentAllowance] = await Promise.all([
        getUSDTBalance(account.address),
        getUSDTAllowance(account.address)
      ]);
      
      setUserBalance(balance);
      setAllowance(currentAllowance);
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleMaxClick = () => {
    const maxAmount = formatCurrency(userBalance, 6, '', 6); // USDT has 6 decimals
    setAmount(maxAmount);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!account) {
      setError('Please connect your wallet');
      setIsLoading(false);
      return;
    }

    try {
      // Validate amount
      if (!isValidAmount(amount)) {
        setError('Please enter a valid amount');
        setIsLoading(false);
        return;
      }

      const amountBigInt = parseTokenAmount(amount, 6); // USDT has 6 decimals

      // Check if user has enough balance
      if (amountBigInt > userBalance) {
        setError('Insufficient USDT balance');
        setIsLoading(false);
        return;
      }

      // Fund the scholarship
      const txHash = await fundScholarship({
        tokenId: scholarship.id,
        amount: amountBigInt,
        account
      });

      console.log('Scholarship funded successfully:', txHash);
      setIsSuccess(true);
      
      // Show success message for 2 seconds before closing
      setTimeout(() => {
        onFundComplete();
        setIsSuccess(false);
        setAmount('');
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Error funding scholarship:', err);
      const errorMessage = handleContractError(err);
      setError(errorMessage);
    } finally {
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
            <p className="text-gray-400 text-sm mt-2">You will receive CIRQA tokens as rewards</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
                  Amount (USDT)
                </label>
                {loadingBalance ? (
                  <Spinner size="sm" />
                ) : (
                  <span className="text-xs text-gray-400">
                    Balance: {formatCurrency(userBalance, 6, '', 2)} USDT
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white pr-16"
                  disabled={isLoading || loadingBalance}
                />
                <button
                  type="button"
                  className="cursor-pointer absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-gray-600 px-2 py-1 rounded text-gray-300 hover:bg-gray-500 transition-colors"
                  onClick={handleMaxClick}
                  disabled={isLoading || loadingBalance}
                >
                  MAX
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Student: {scholarship.student.slice(0, 6)}...{scholarship.student.slice(-4)}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-900/30 border border-red-800 rounded-md">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-md">
              <p className="text-blue-400 text-sm">
                💡 You'll receive CIRQA tokens as rewards for funding this scholarship
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cursor-pointer px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center min-w-[80px]"
                disabled={isLoading || !account || loadingBalance}
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