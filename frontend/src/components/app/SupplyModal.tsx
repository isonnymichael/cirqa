'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSendTransaction, useActiveAccount } from 'thirdweb/react';
import { readContract } from 'thirdweb';
import { prepareContractCall, getContract } from 'thirdweb';
import { cirqaProtocolContract } from '@/lib/contracts';
import { parseUnits, formatUnits, MaxUint256 } from 'ethers';
import { kiiTestnet } from '@/lib/chain';
import Image from 'next/image';

interface SupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: any;
  onSuccess: () => void;
}

const SupplyModal: React.FC<SupplyModalProps> = ({ isOpen, onClose, asset, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isSupplying, setIsSupplying] = useState(false);
  const { mutate: sendTransaction } = useSendTransaction();
  const account = useActiveAccount();
  const modalRef = useRef<HTMLDivElement>(null);
  
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

  const handleSupply = async () => {
    if (!asset || !amount || !account) return;

    const amountBN = parseUnits(amount, asset.decimals);
    console.log(asset.decimals);
    const assetContract = getContract({ client: cirqaProtocolContract.client, chain: kiiTestnet, address: asset.assetAddress });

    try {
      const allowance = await readContract({
        contract: assetContract,
        method: "function allowance(address owner, address spender) view returns (uint256)",
        params: [account.address, cirqaProtocolContract.address]
      });

      if (allowance < amountBN) {
        setIsApproving(true);
        const approveTx = prepareContractCall({
          contract: assetContract,
          method: "function approve(address spender, uint256 amount)",
          params: [cirqaProtocolContract.address, MaxUint256], // Unlimited approval
        });
        
        await new Promise((resolve, reject) => {
          sendTransaction(approveTx, { 
            onSuccess: resolve,
            onError: reject
          });
        });

        setIsApproving(false);
      }

      // Proceed with supply
      setIsSupplying(true);
      const supplyTransaction = prepareContractCall({
        contract: cirqaProtocolContract,
        method: 'function supply(address,uint256)',
        params: [asset.assetAddress, amountBN],
      });

      await new Promise((resolve, reject) => {
        sendTransaction(supplyTransaction, {
          onSuccess: (receipt) => {
            console.log(receipt);
            // Add a longer delay before calling onSuccess to allow blockchain to update
            setTimeout(() => {
              console.log('Supply transaction confirmed, updating asset data...');
              onSuccess();
              onClose();
              resolve(receipt);
            }, 5000);
          },
          onError: (error) => {
            console.error('Supply failed', error);
            reject(error);
          },
        });
      });

    } catch (error) {
      console.error('Failed to prepare supply transaction', error);
    } finally {
      setIsApproving(false);
      setIsSupplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center">
      <div ref={modalRef} className="bg-gray-800 p-6 rounded-lg shadow-xl md:w-full max-w-md relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Supply {asset.symbol}</h2>
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
              onClick={() => setAmount(formatUnits(asset.walletBalance, asset.decimals))}
            >
              Max
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Balance: {formatUnits(asset.walletBalance, asset.decimals)} {asset.symbol}</p>
        </div>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="cursor-pointer btn-secondary">Cancel</button>
          <button 
            onClick={handleSupply} 
            className="cursor-pointer btn-primary" 
            disabled={isApproving || isSupplying}
          >
            {isApproving ? 'Approving...' : isSupplying ? 'Supplying...' : 'Supply'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplyModal;