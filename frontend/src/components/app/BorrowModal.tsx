'use client';

import React, { useState } from 'react';
import { useSendTransaction, useReadContract } from 'thirdweb/react';
import { prepareContractCall } from 'thirdweb';
import { cirqaProtocolContract } from '@/lib/contracts';
import { parseUnits, formatUnits } from 'ethers';

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: any;
  onSuccess: () => void;
}

const BorrowModal: React.FC<BorrowModalProps> = ({ isOpen, onClose, asset, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [isBorrowing, setIsBorrowing] = useState(false);
  const { mutate: sendTransaction } = useSendTransaction();

  // Fetch protocol fee from blockchain
  const { data: protocolFeeBps, isLoading: isProtocolFeeLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'function protocolFeeBps() view returns (uint256)',
    params: [],
  });

  // Calculate fee percentage
  const feePercentage = protocolFeeBps ? Number(protocolFeeBps) / 100 : 0;

  const handleBorrow = async () => {
    if (!asset || !amount) return;

    const amountBN = parseUnits(amount, asset.decimals);

    try {
      setIsBorrowing(true);
      const transaction = prepareContractCall({
        contract: cirqaProtocolContract,
        method: 'function borrow(address,uint256)',
        params: [asset.assetAddress, amountBN],
      });

      await new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (receipt) => {
            console.log(receipt);
            // Add a longer delay before calling onSuccess to allow blockchain to update
            setTimeout(() => {
              console.log('Borrow transaction confirmed, updating asset data...');
              onSuccess();
              onClose();
              resolve(receipt);
            }, 5000);
          },
          onError: (error) => {
            console.error('Borrow failed', error);
            reject(error);
          },
        });
      });

    } catch (error) {
      console.error('Failed to prepare borrow transaction', error);
    } finally {
      setIsBorrowing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Borrow {asset.symbol}</h2>
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
          <input
            type="text"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder={`Available: ${formatUnits(asset.available, asset.decimals)}`}
          />
        </div>
        
        {/* Protocol Fee Information */}
        <div className="mb-4 text-sm text-gray-400">
          <p>Protocol Fee: {isProtocolFeeLoading ? 'Loading...' : `${feePercentage}%`}</p>
          {amount && !isProtocolFeeLoading && (
            <p className="mt-1">
              Fee Amount: {(parseFloat(amount) * feePercentage / 100).toFixed(asset.decimals > 8 ? 8 : asset.decimals)} {asset.symbol}
            </p>
          )}
        </div>
        
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="cursor-pointer btn-secondary">Cancel</button>
          <button onClick={handleBorrow} className="cursor-pointer btn-primary" disabled={isBorrowing}>
            {isBorrowing ? 'Borrowing...' : 'Borrow'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BorrowModal;