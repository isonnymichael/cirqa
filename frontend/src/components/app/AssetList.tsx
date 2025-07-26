'use client';

'use client';

import React from 'react';
import Spinner from '@/app/Spinner';
import { useReadContract, useActiveAccount } from 'thirdweb/react';
import { getContract } from 'thirdweb';
import { formatUnits } from 'ethers';
import { cirqaProtocolContract } from '@/lib/contracts';
import { kiiTestnet } from '@/lib/chain';
import { Abi } from 'viem';

const erc20Abi = [
  { "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" },
  { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" },
  { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" },
  { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "stateMutability": "view", "type": "function" }
];

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

  const { data: assetInfo, isLoading: isAssetInfoLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'assetInfo',
    params: [pid],
  });

  const assetAddress = Array.isArray(assetInfo) && assetInfo[0] ? assetInfo[0] : '';
  const assetContract = assetAddress && typeof assetAddress === 'string' ? getContract({ client: cirqaProtocolContract.client, chain: kiiTestnet, address: assetAddress, abi: erc20Abi as Abi }) : null;

  // @ts-ignore
  const { data: name, isLoading: isNameLoading } = useReadContract({ contract: assetContract, method: 'name', params: [], enabled: !!assetContract });
  // @ts-ignore
  const { data: symbol, isLoading: isSymbolLoading } = useReadContract({ contract: assetContract, method: 'symbol', params: [], enabled: !!assetContract });
  // @ts-ignore
  const { data: decimals, isLoading: isDecimalsLoading } = useReadContract({ contract: assetContract, method: 'decimals', params: [], enabled: !!assetContract });
  // @ts-ignore
  const { data: walletBalance, isLoading: isWalletBalanceLoading } = useReadContract({ contract: assetContract, method: 'balanceOf', params: account ? [account.address] : [], enabled: !!account && !!assetContract });

  const { data: userInfo, isLoading: isUserInfoLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'userInfo',
    params: account ? [pid, account.address] : [],
    queryOptions: { enabled: !!account }, 
  });

  const supplied = userInfo?.[0] ?? BigInt(0);
  const borrowed = userInfo?.[1] ?? BigInt(0);

  const isLoading = isAssetInfoLoading || isNameLoading || isSymbolLoading || isDecimalsLoading || isWalletBalanceLoading || isUserInfoLoading;

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

  return (
    <tr className="border-b border-gray-800">
      <td className="py-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            {typeof symbol === 'string' ? symbol : '?'}
          </div>
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-gray-400">{symbol}</div>
          </div>
        </div>
      </td>
      <td className="py-4">
        <div className="font-medium">{'N/A'}</div>
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
            <div className="font-medium">{'N/A'}</div>
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
  const { data: assetsLength, isLoading } = useReadContract({
    contract: cirqaProtocolContract,
    method: 'getAssetsLength',
    params: [],
  });

  console.log(assetsLength);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-800">
            <th className="pb-4">Asset</th>
            <th className="pb-4">{type === 'supply' ? 'APY' : 'Borrow APY'}</th>
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
          ) : Number(assetsLength || 0) === 0 ? (
            <tr><td colSpan={6} className="text-center py-4">No assets available.</td></tr>
          ) : (
            [...Array(Number(assetsLength || 0))].map((_, i) => (
              <AssetRow key={i} pid={BigInt(i)} type={type} />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AssetList;