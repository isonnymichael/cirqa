'use client';

import React, { useEffect, useState } from 'react';
import Spinner from '@/app/Spinner';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { getContract, readContract, prepareContractCall } from 'thirdweb';
import { useSendTransaction } from 'thirdweb/react';
import { formatUnits } from 'ethers';
import { cirqaProtocolContract } from '@/lib/contracts';
import { kiiTestnet } from '@/lib/chain';
import SupplyModal from './SupplyModal';
import BorrowModal from './BorrowModal';

type Asset = {
  pid: bigint;
  assetAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  walletBalance: bigint;
  supplied: bigint;
  borrowed: bigint;
  allocPoint?: bigint;
  totalAllocPoint?: bigint;
  available?: bigint;
  collateralEnabled?: boolean;
};

type AssetListProps = {
  type: 'supply' | 'borrow';
};

const formatDisplayValue = (value: any, decimals = 18, prefix = '', suffix = '') => {
  if (value === undefined || value === null) return '...';
  const formatted = parseFloat(formatUnits(value, decimals)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${prefix}${formatted}${suffix}`;
};

const AssetRow = ({ asset, type, onSupplyClick, onBorrowClick, onCollateralToggle }: { asset: Asset, type: 'supply' | 'borrow', onSupplyClick: () => void, onBorrowClick: () => void, onCollateralToggle: (pid: bigint, enabled: boolean) => Promise<void> }) => {
  const { name, symbol, decimals, walletBalance, supplied, borrowed, allocPoint, totalAllocPoint, collateralEnabled } = asset;
  const [collateralLoading, setCollateralLoading] = useState(false);

  let shareOfPool = null;
  if (allocPoint && totalAllocPoint && totalAllocPoint > BigInt(0)) {
    shareOfPool = type === 'supply'
      ? Number(allocPoint) / Number(totalAllocPoint) * 100
      : Number(allocPoint) / Number(totalAllocPoint) * 100 / 2;
  }

  const handleToggleCollateral = async () => {
      setCollateralLoading(true);
      try {
        await onCollateralToggle(asset.pid, !collateralEnabled);
      } finally {
        setCollateralLoading(false);
      }
    };

  return (
    <tr className="border-b border-gray-800">
      <td className="py-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-700 text-xs rounded-full flex items-center justify-center">
            {typeof symbol === 'string' ? symbol.charAt(0) : '?'}
          </div>
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-gray-400">{symbol}</div>
          </div>
        </div>
      </td>
      <td className="py-4">
        <div className="font-medium">{shareOfPool !== null ? `${shareOfPool.toFixed(2)}%` : 'N/A'}</div>
      </td>
      <td className="py-4">
        <div className="font-medium">{formatDisplayValue(walletBalance, decimals)}</div>
        <div className="text-sm text-gray-400">{symbol}</div>
      </td>
      {type === 'supply' ? (
        <>
          <td className="py-4">
            <div className="font-medium">{formatDisplayValue(supplied, decimals)}</div>
            <div className="text-sm text-gray-400">{symbol}</div>
          </td>
          <td className="py-4">
            <div className="flex items-center">
              <button
                className={`cursor-pointer w-10 h-6 rounded-full relative mr-2 ${collateralEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                onClick={handleToggleCollateral}
                disabled={collateralLoading}
              >
                {collateralLoading ? (
                  <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                    </svg>
                  </span>
                ) : (
                  <span
                    className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-transform duration-300 ${collateralEnabled ? 'translate-x-4 bg-white' : 'bg-gray-400'}`}
                  ></span>
                )}
                <div className={`absolute left-1 top-1 w-4 h-4 rounded-full transition-all duration-200 ${collateralEnabled ? 'bg-white left-5' : 'bg-white'}`}></div>
              </button>
            </div>
          </td>
        </>
      ) : (
        <>
          <td className="py-4">
            <div className="font-medium">{formatDisplayValue(borrowed, decimals)}</div>
            <div className="text-sm text-gray-400">{symbol}</div>
          </td>
          <td className="py-4">
            <div className="font-medium">{formatDisplayValue(asset.available, decimals)}</div>
            <div className="text-sm text-gray-400">{symbol}</div>
          </td>
        </>
      )}
      <td className="py-4 text-right">
        <button
          className="cursor-pointer btn-primary hover:bg-accent hover:text-white transition-all"
          onClick={type === 'supply' ? onSupplyClick : onBorrowClick}
        >
          {type === 'supply' ? 'Supply' : 'Borrow'}
        </button>
      </td>
    </tr>
  );
};

const AssetList = ({ type }: AssetListProps) => {
  const account = useActiveAccount();
  const { data: assetLength, isLoading: isAssetLengthLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'function getAssetsLength() view returns (uint256)',
    params: [],
  });

  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupplyModalOpen, setIsSupplyModalOpen] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const { mutate: sendTransaction } = useSendTransaction();

  const fetchAllAssets = async () => {
    if (!assetLength) return;
    setIsLoading(true);
    try {
      const assetsData = await Promise.all(
        [...Array(Number(assetLength))].map(async (_, i) => {
          const pid = BigInt(i);
          const assetInfo = await readContract({
            contract: cirqaProtocolContract,
            method: 'function assetInfo(uint256) view returns (address asset, uint256 allocPoint, uint256 lastRewardTime, uint256 accCirqaPerShare, uint256 totalPoints)',
            params: [pid],
          });
          const assetAddress = assetInfo[0];
          const allocPoint = assetInfo[1];
          const totalAllocPoint = await readContract({
            contract: cirqaProtocolContract,
            method: 'function totalAllocPoint() view returns (uint256)',
            params: [],
          });
          const assetContract = getContract({ client: cirqaProtocolContract.client, chain: kiiTestnet, address: assetAddress });
          const [name, symbol, decimals] = await Promise.all([
            readContract({ contract: assetContract, method: 'function name() view returns (string)', params: [] }),
            readContract({ contract: assetContract, method: 'function symbol() view returns (string)', params: [] }),
            readContract({ contract: assetContract, method: 'function decimals() view returns (uint8)', params: [] }),
          ]);

          let walletBalance = BigInt(0);
          let supplied = BigInt(0);
          let borrowed = BigInt(0);
          let available = BigInt(0);
          let collateralEnabled = false;

          if (account?.address) {
            const [balance, userInfo, isCollateral] = await Promise.all([
              readContract({ contract: assetContract, method: 'function balanceOf(address) view returns (uint256)', params: [account.address] }),
              readContract({ contract: cirqaProtocolContract, method: 'function userInfo(uint256, address) view returns (uint256 supplied, uint256 borrowed)', params: [pid, account.address] }),
              readContract({ contract: cirqaProtocolContract, method: 'function isCollateral(uint256,address) view returns (bool)', params: [pid, account.address] })
            ]);
            walletBalance = balance;
            supplied = userInfo[0];
            borrowed = userInfo[1];
            collateralEnabled = isCollateral;

            if (type === 'borrow') {
              try {
                available = await readContract({ contract: assetContract, method: 'function balanceOf(address) view returns (uint256)', params: [cirqaProtocolContract.address] });
              } catch (e) {
                available = BigInt(0);
              }
            }
          }

          return { pid, assetAddress, name, symbol, decimals, walletBalance, supplied, borrowed, allocPoint, totalAllocPoint, available, collateralEnabled };
        })
      );
      setAssets(assetsData);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (assetLength) {
      fetchAllAssets();
    }
  }, [assetLength, account]);

  const handleCollateralToggle = (pid: bigint, enabled: boolean) => {
    return new Promise<void>((resolve, reject) => {
      if (!account) {
        return reject(new Error("Account not connected"));
      }
      const transaction = prepareContractCall({
        contract: cirqaProtocolContract,
        method: 'function setCollateralStatus(uint256,bool)',
        params: [pid, enabled]
      });
      sendTransaction(transaction, {
        onSuccess: () => {
          fetchAllAssets();
          resolve();
        },
        onError: (error) => {
          console.error('Collateral toggle failed', error);
          reject(error);
        },
      });
    });
  };

  const openSupplyModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsSupplyModalOpen(true);
  };

  const openBorrowModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsBorrowModalOpen(true);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-800">
            <th className="pb-4">Asset</th>
            <th className="pb-4">{type === 'supply' ? 'Pool %' : 'Borrow APY'}</th>
            <th className="pb-4">Wallet Balance</th>
            {type === 'supply' ? (
              <>
                <th className="pb-4">Supplied</th>
                <th className="pb-4">Collateral</th>
              </>
            ) : (
              <>
                <th className="pb-4">Borrowed</th>
                <th className="pb-4">Available</th>
              </>
            )}
            <th className="pb-4"></th>
          </tr>
        </thead>
        <tbody>
          {isLoading || isAssetLengthLoading ? (
            <tr>
              <td colSpan={6} className="text-center py-4">
                <div className="flex justify-center">
                  <Spinner />
                </div>
              </td>
            </tr>
          ) : assets.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-4">No assets available.</td></tr>
          ) : (
            assets.map((asset) => (
              <AssetRow
                key={asset.assetAddress}
                asset={asset}
                type={type}
                onSupplyClick={() => openSupplyModal(asset)}
                onBorrowClick={() => openBorrowModal(asset)}
                onCollateralToggle={handleCollateralToggle}
              />
            ))
          )}
        </tbody>
      </table>

      {selectedAsset && (
        <>
          <SupplyModal
            isOpen={isSupplyModalOpen}
            onClose={() => setIsSupplyModalOpen(false)}
            asset={selectedAsset}
            onSuccess={fetchAllAssets}
          />
          <BorrowModal
            isOpen={isBorrowModalOpen}
            onClose={() => setIsBorrowModalOpen(false)}
            asset={selectedAsset}
            onSuccess={fetchAllAssets}
          />
        </>
      )}
    </div>
  );
};

export default AssetList;