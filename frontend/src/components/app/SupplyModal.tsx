'use client';

import React, { useState } from 'react';
import { useSendTransaction, useActiveAccount } from 'thirdweb/react';
import { readContract } from 'thirdweb';
import { prepareContractCall, getContract } from 'thirdweb';
import { cirqaProtocolContract } from '@/lib/contracts';
import { parseUnits, formatUnits, MaxUint256 } from 'ethers';
import { kiiTestnet } from '@/lib/chain';

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
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Supply {asset.symbol}</h2>
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Amount</label>
          <input
            type="text"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder={`Balance: ${formatUnits(asset.walletBalance, asset.decimals)}`}
          />
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