'use client';

import React, { useState } from 'react';
import { useSendTransaction } from 'thirdweb/react';
import { prepareContractCall } from 'thirdweb';
import { cirqaProtocolContract } from '@/lib/contracts';
import { parseUnits, formatUnits } from 'ethers';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: any;
  onSuccess: () => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, asset, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { mutate: sendTransaction } = useSendTransaction();

  const handleWithdraw = async () => {
    if (!asset || !amount) return;

    const amountBN = parseUnits(amount, asset.decimals);

    try {
      setIsWithdrawing(true);
      const transaction = prepareContractCall({
        contract: cirqaProtocolContract,
        method: 'function withdraw(address,uint256)',
        params: [asset.assetAddress, amountBN],
      });

      await new Promise((resolve, reject) => {
        sendTransaction(transaction, {
          onSuccess: (receipt) => {
            console.log(receipt);
            // Add a longer delay before calling onSuccess to allow blockchain to update
            setTimeout(() => {
              console.log('Withdraw transaction confirmed, updating asset data...');
              onSuccess();
              onClose();
              resolve(receipt);
            }, 5000);
          },
          onError: (error) => {
            console.error('Withdraw failed', error);
            reject(error);
          },
        });
      });

    } catch (error) {
      console.error('Failed to prepare withdraw transaction', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl md:w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Withdraw {asset.symbol}</h2>
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
          <input
            type="text"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder={`Supplied: ${formatUnits(asset.supplied, asset.decimals)}`}
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="cursor-pointer btn-secondary">Cancel</button>
          <button onClick={handleWithdraw} className="cursor-pointer btn-primary" disabled={isWithdrawing}>
            {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;