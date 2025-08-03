'use client';

import React, { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { 
  withdrawFunds, 
  parseTokenAmount, 
  formatCurrency,
  handleContractError,
  isValidAmount,
  hasEnoughBalance,
  isStudent,
  getProtocolFee
} from '@/helper';
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
  const [protocolFee, setProtocolFee] = useState<bigint>(BigInt(0));
  const [loadingData, setLoadingData] = useState(false);
  const [isValidStudent, setIsValidStudent] = useState(true);
  
  const account = useActiveAccount();

  // Check if user is the scholarship student and load protocol fee
  useEffect(() => {
    if (isOpen && account?.address) {
      checkStudentAndLoadData();
    }
  }, [isOpen, account?.address, scholarship.id]);

  const checkStudentAndLoadData = async () => {
    if (!account?.address) return;
    
    setLoadingData(true);
    try {
      const [studentCheck, feeData] = await Promise.all([
        isStudent(scholarship.id, account.address),
        getProtocolFee()
      ]);
      
      setIsValidStudent(studentCheck);
      setProtocolFee(feeData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to verify student status');
    } finally {
      setLoadingData(false);
    }
  };

  // Calculate amounts after protocol fee
  const calculateAmounts = (withdrawAmount: string) => {
    if (!withdrawAmount || !isValidAmount(withdrawAmount)) return null;
    
    const amountBigInt = parseTokenAmount(withdrawAmount, 6); // USDT has 6 decimals
    const feeAmount = (amountBigInt * protocolFee) / BigInt(10000); // Protocol fee in basis points
    const netAmount = amountBigInt - feeAmount;
    
    return {
      gross: amountBigInt,
      fee: feeAmount,
      net: netAmount
    };
  };

  const amounts = calculateAmounts(amount);
  const maxBalance = formatCurrency(scholarship.balance, 6, '', 6); // USDT has 6 decimals

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
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

    if (!account) {
      setError('Please connect your wallet');
      setIsLoading(false);
      return;
    }

    if (!isValidStudent) {
      setError('Only the scholarship owner can withdraw funds');
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

      // Check if scholarship has enough balance
      const hasBalance = await hasEnoughBalance(scholarship.id, amountBigInt);
      if (!hasBalance) {
        setError('Insufficient scholarship balance');
        setIsLoading(false);
        return;
      }

      // Withdraw funds
      const txHash = await withdrawFunds({
        tokenId: scholarship.id,
        amount: amountBigInt,
        account
      });

      console.log('Funds withdrawn successfully:', txHash);
      setIsSuccess(true);
      
      // Show success message for 2 seconds before closing
      setTimeout(() => {
        onWithdrawComplete();
        setIsSuccess(false);
        setAmount('');
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error('Error withdrawing funds:', err);
      const errorMessage = handleContractError(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Loading state
  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-4 md:p-6 max-w-md w-full border border-gray-700">
          <div className="flex justify-center items-center h-24 md:h-32 text-center">
            <Spinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  // Check if user is the scholarship owner
  if (!isValidStudent) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-4 md:p-6 max-w-md w-full border border-gray-700">
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Withdraw Funds</h2>
          <div className="text-center py-4 md:py-6">
            <div className="text-red-500 text-lg md:text-xl mb-2">✗</div>
            <p className="text-red-400 font-medium text-sm md:text-base">Only the scholarship owner can withdraw funds.</p>
          </div>
          <div className="flex justify-end mt-4 md:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-3 md:px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm md:text-base"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-4 md:p-6 max-w-md w-full border border-gray-700">
        <div className="flex justify-between items-start mb-3 md:mb-4">
        <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Withdraw Funds from Scholarship #{scholarship.id}</h2>
          <button
              onClick={onClose}
              className="cursor-pointer text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
          </button>
        </div>
        
        {isSuccess ? (
          <div className="text-center py-4 md:py-6">
            <div className="text-green-500 text-lg md:text-xl mb-2">✓</div>
            <p className="text-green-400 font-medium text-sm md:text-base">Funds withdrawn successfully!</p>
            {amounts && (
              <p className="text-gray-400 text-xs md:text-sm mt-2">
                You received: {formatCurrency(amounts.net, 6, '', 2)} USDT
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3 md:mb-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-2">
                <label htmlFor="amount" className="block text-xs md:text-sm font-medium text-gray-300">
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
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white pr-14 md:pr-16 text-sm md:text-base"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="cursor-pointer absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-gray-600 px-2 py-1 rounded text-gray-300 hover:bg-gray-500 transition-colors"
                  onClick={handleMaxClick}
                  disabled={isLoading}
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Fee breakdown */}
            {amounts && (
              <div className="mb-3 md:mb-4 p-2 md:p-3 bg-gray-700/50 rounded-md">
                <h4 className="text-xs md:text-sm font-medium mb-2">Fee Breakdown</h4>
                <div className="space-y-1 text-xs md:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Withdrawal Amount:</span>
                    <span>{formatCurrency(amounts.gross, 6, '', 2)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Protocol Fee ({(Number(protocolFee) / 100).toFixed(2)}%):</span>
                    <span className="text-red-400">-{formatCurrency(amounts.fee, 6, '', 2)} USDT</span>
                  </div>
                  <div className="flex justify-between font-medium border-t border-gray-600 pt-1">
                    <span>You'll receive:</span>
                    <span className="text-green-400">{formatCurrency(amounts.net, 6, '', 2)} USDT</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-3 md:mb-4 p-2 bg-red-900/30 border border-red-800 rounded-md">
                <p className="text-red-400 text-xs md:text-sm break-words">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 md:mt-6">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer px-3 md:px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm md:text-base"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="cursor-pointer px-3 md:px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center min-w-[70px] md:min-w-[80px] text-sm md:text-base"
                disabled={isLoading || scholarship.balance <= BigInt(0)}
              >
                {isLoading ? <div className="text-center"><Spinner size="sm" /></div> : 'Withdraw'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WithdrawFundsModal;