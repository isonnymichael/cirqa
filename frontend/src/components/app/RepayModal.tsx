'use client';

import React, { useState } from 'react';
import { useSendTransaction, useActiveAccount } from 'thirdweb/react';
import { readContract } from 'thirdweb';
import { prepareContractCall, getContract } from 'thirdweb';
import { cirqaProtocolContract } from '@/lib/contracts';
import { parseUnits, formatUnits, MaxUint256 } from 'ethers';
import { kiiTestnet } from '@/lib/chain';

interface RepayModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: any;
  onSuccess: () => void;
}

const RepayModal: React.FC<RepayModalProps> = ({ isOpen, onClose, asset, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRepaying, setIsRepaying] = useState(false);
  const { mutate: sendTransaction } = useSendTransaction();
  const account = useActiveAccount();

  const handleRepay = async () => {
    if (!asset || !amount || !account) return;

    const amountBN = parseUnits(amount, asset.decimals);
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

      // Proceed with repay
      setIsRepaying(true);
      const repayTransaction = prepareContractCall({
        contract: cirqaProtocolContract,
        method: 'function repay(address,uint256)',
        params: [asset.assetAddress, amountBN],
      });

      await new Promise((resolve, reject) => {
        sendTransaction(repayTransaction, {
          onSuccess: (receipt) => {
            console.log(receipt);
            // Add a longer delay before calling onSuccess to allow blockchain to update
            setTimeout(() => {
              console.log('Repay transaction confirmed, updating asset data...');
              onSuccess();
              onClose();
              resolve(receipt);
            }, 5000);
          },
          onError: (error) => {
            console.error('Repay failed', error);
            reject(error);
          },
        });
      });

    } catch (error) {
      console.error('Failed to prepare repay transaction', error);
    } finally {
      setIsApproving(false);
      setIsRepaying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl md:w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Repay {asset.symbol}</h2>
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
          <input
            type="text"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder={`Borrowed: ${formatUnits(asset.borrowed, asset.decimals)}`}
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="cursor-pointer btn-secondary">Cancel</button>
          <button 
            onClick={handleRepay} 
            className="cursor-pointer btn-primary" 
            disabled={isApproving || isRepaying}
          >
            {isApproving ? 'Approving...' : isRepaying ? 'Repaying...' : 'Repay'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepayModal;