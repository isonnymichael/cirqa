'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSendTransaction, useActiveAccount } from 'thirdweb/react';
import { prepareContractCall, readContract } from 'thirdweb';
import { cirqaProtocolContract } from '@/lib/contracts';
import { parseUnits, formatUnits } from 'ethers';
import Image from 'next/image';
import { useToast } from "@/components/ToastContext";

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
  const account = useActiveAccount();
  const modalRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  
  // Reset amount when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('0');
    }
  }, [isOpen]);
  
  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleWithdraw = async () => {
    if (!asset || !amount || !account) return;

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
          onSuccess: async (receipt) => {
            // Get pending CIRQA rewards
            try {
              const assetId = asset.assetId || 0;
              const pendingRewards = await readContract({
                contract: cirqaProtocolContract,
                method: 'function pendingCirqa(uint256,address) view returns (uint256)',
                params: [assetId, account?.address],
              });
              
              const formattedRewards = formatUnits(pendingRewards || 0, 18);
              showToast(
                `Withdraw transaction confirmed! You earned ${parseFloat(formattedRewards).toFixed(6)} CIRQA rewards!`,
                `https://kiichain.explorer/tx/${receipt.transactionHash}`,
                "View Receipt"
              );
            } catch (error) {
              console.error('Failed to fetch rewards', error);
              showToast(
                "Withdraw transaction confirmed!",
                `https://kiichain.explorer/tx/${receipt.transactionHash}`,
                "View Receipt"
              );
            }
            
            setTimeout(() => {
              onSuccess();
              onClose();
              resolve(receipt);
            }, 5000);
          },
          onError: (error) => {
            showToast(
              "Withdraw transaction failed!",
              undefined,
              "Dismiss"
            );
            console.error('Withdraw failed', error);
            reject(error);
          },
        });
      });
    } catch (error) {
      showToast(
        "Failed to prepare withdraw transaction!",
        undefined,
        "Dismiss"
      );
      console.error('Failed to prepare withdraw transaction', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center">
      <div ref={modalRef} className="bg-gray-800 p-6 rounded-lg shadow-xl md:w-full max-w-md relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Withdraw {asset.symbol}</h2>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200 cursor-pointer"
            aria-label="Close"
          >
            <Image src="/close.svg" alt="Close" width={24} height={24} />
          </button>
        </div>
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
          <div className="relative">
            <input
              type="text"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-accent hover:text-accent-light px-2 py-0.5 rounded cursor-pointer"
              onClick={() => setAmount(formatUnits(asset.supplied, asset.decimals))}
            >
              Max
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Supplied: {formatUnits(asset.supplied, asset.decimals)} {asset.symbol}</p>
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