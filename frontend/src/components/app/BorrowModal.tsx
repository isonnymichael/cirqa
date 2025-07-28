'use client';

import React, { useState } from 'react';
import { useSendTransaction } from 'thirdweb/react';
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
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const handleBorrow = async () => {
    if (!asset || !amount) return;

    try {
      const amountBN = parseUnits(amount, asset.decimals);
      const transaction = prepareContractCall({
        contract: cirqaProtocolContract,
        method: 'function borrow(address,uint256)',
        params: [asset.assetAddress, amountBN],
      });

      sendTransaction(transaction, {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
        onError: (error) => {
          console.error('Borrow failed', error);
        },
      });
    } catch (error) {
      console.error('Failed to prepare borrow transaction', error);
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
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="cursor-pointer btn-secondary">Cancel</button>
          <button onClick={handleBorrow} className="cursor-pointer btn-primary" disabled={isPending}>
            {isPending ? 'Borrowing...' : 'Borrow'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BorrowModal;