'use client';

import React, { useEffect, useState } from 'react';
import Spinner from '@/app/Spinner';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { getContract, readContract } from 'thirdweb';
import { formatUnits } from 'ethers';
import { cirqaProtocolContract } from '@/lib/contracts';
import { kiiTestnet } from '@/lib/chain';

type AssetListProps = {
  type: 'supply' | 'borrow';
};

const formatDisplayValue = (value: any, decimals = 18, prefix = '', suffix = '') => {
  if (value === undefined || value === null) return '...';
  const formatted = parseFloat(formatUnits(value, decimals)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${prefix}${formatted}${suffix}`;
};

const AssetRow = ({ pid, type }: { pid: bigint, type: 'supply' | 'borrow' }) => {
  const account = useActiveAccount();
  const [assetData, setAssetData] = useState<{ name: string, symbol: string, decimals: number, walletBalance: bigint, supplied: bigint, borrowed: bigint, allocPoint?: bigint, totalAllocPoint?: bigint, available?: bigint } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssetData = async () => {
      setIsLoading(true);
      try {
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
        try {
          const tokenUri = await readContract({
            contract: assetContract,
            method: 'function tokenURI(uint256) view returns (string)',
            params: [BigInt(1)],
          });
          console.log(`[PID: ${pid}] Token URI:`, tokenUri);
        } catch (e) {
          console.log(`[PID: ${pid}] Could not fetch tokenURI. It might not be implemented on this contract.`);
        }
        const [name, symbol, decimals] = await Promise.all([
          readContract({ contract: assetContract, method: 'function name() view returns (string)', params: [] }),
          readContract({ contract: assetContract, method: 'function symbol() view returns (string)', params: [] }),
          readContract({ contract: assetContract, method: 'function decimals() view returns (uint8)', params: [] }),
        ]);
        let walletBalance = BigInt(0);
        let supplied = BigInt(0);
        let borrowed = BigInt(0);
        let available = BigInt(0);
        if (account?.address) {
          const [balance, userInfo] = await Promise.all([
            readContract({ contract: assetContract, method: 'function balanceOf(address) view returns (uint256)', params: [account.address] }),
            readContract({ contract: cirqaProtocolContract, method: 'function userInfo(uint256, address) view returns (uint256 supplied, uint256 borrowed)', params: [pid, account.address] })
          ]);
          walletBalance = balance;
          supplied = userInfo[0];
          borrowed = userInfo[1];
        }
        // Fetch available liquidity for borrow
        if (type === 'borrow') {
          try {
            available = await readContract({ contract: assetContract, method: 'function balanceOf(address) view returns (uint256)', params: [cirqaProtocolContract.address] });
          } catch (e) {
            available = BigInt(0);
          }
        }
        setAssetData({ name, symbol, decimals, walletBalance, supplied, borrowed, allocPoint, totalAllocPoint, available });
      } catch (error) {
        console.error('Failed to fetch asset data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssetData();
  }, [pid, account, type]);

  if (isLoading) {
    return (
      <tr className="border-b border-gray-800">
        <td colSpan={6} className="py-4 text-center">
          <div className="flex justify-center">
            <Spinner />
          </div>
        </td>
      </tr>
    );
  }

  if (!assetData) return null; // Or some fallback UI

  const { name, symbol, decimals, walletBalance, supplied, borrowed, allocPoint, totalAllocPoint } = assetData;
  let shareOfPool = null;
  if (allocPoint && totalAllocPoint && totalAllocPoint > BigInt(0)) {
    shareOfPool = type === 'supply'
      ? Number(allocPoint) / Number(totalAllocPoint) * 100
      : Number(allocPoint) / Number(totalAllocPoint) * 100 / 2;
  }

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
              <div className="w-10 h-6 bg-gray-700 rounded-full relative mr-2">
                <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-accent"></div>
              </div>
              <span className="text-sm">{'N/A'}</span>
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
            <div className="font-medium">{formatDisplayValue(assetData.available, decimals)}</div>
            <div className="text-sm text-gray-400">{symbol}</div>
          </td>
        </>
      )}
      <td className="py-4 text-right">
        <button className="btn-primary hover:bg-accent hover:text-white transition-all">
          {type === 'supply' ? 'Supply' : 'Borrow'}
        </button>
      </td>
    </tr>
  );
};

const AssetList = ({ type }: AssetListProps) => {
  const { data: assetLength, isLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'function getAssetsLength() view returns (uint256)',
    params: [],
  });

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
          {isLoading ? (
            <tr>
              <td colSpan={6} className="text-center py-4">
                <div className="flex justify-center">
                  <Spinner />
                </div>
              </td>
            </tr>
          ) : !assetLength ? (
            <tr><td colSpan={6} className="text-center py-4">Loading assets...</td></tr>
          ) : Number(assetLength) === 0 ? (
            <tr><td colSpan={6} className="text-center py-4">No assets available.</td></tr>
          ) : (
            [...Array(Number(assetLength))].map((_, i) => (
              <AssetRow key={i} pid={BigInt(i)} type={type} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AssetList;