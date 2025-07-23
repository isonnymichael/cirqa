'use client';

import React from 'react';
import Image from 'next/image';

type AssetListProps = {
  type: 'supply' | 'borrow';
};

type Asset = {
  id: string;
  name: string;
  symbol: string;
  apy: string;
  walletBalance: string;
  supplied?: string;
  borrowed?: string;
  price: string;
  liquidationThreshold?: string;
  available?: string;
};

const AssetList = ({ type }: AssetListProps) => {
  // Mock data for assets
  const supplyAssets: Asset[] = [
    {
      id: '1',
      name: 'USD Coin',
      symbol: 'USDC',
      apy: '3.5%',
      walletBalance: '0.00',
      supplied: '0.00',
      price: '$1.00',
      liquidationThreshold: '85%',
    },
    {
      id: '2',
      name: 'Tether',
      symbol: 'USDT',
      apy: '3.2%',
      walletBalance: '0.00',
      supplied: '0.00',
      price: '$1.00',
      liquidationThreshold: '85%',
    },
    {
      id: '3',
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      apy: '0.5%',
      walletBalance: '0.00',
      supplied: '0.00',
      price: '$65,000.00',
      liquidationThreshold: '80%',
    },
    {
      id: '4',
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      apy: '0.8%',
      walletBalance: '0.00',
      supplied: '0.00',
      price: '$3,500.00',
      liquidationThreshold: '82.5%',
    },
  ];

  const borrowAssets: Asset[] = [
    {
      id: '1',
      name: 'USD Coin',
      symbol: 'USDC',
      apy: '5.2%',
      walletBalance: '0.00',
      borrowed: '0.00',
      available: '0.00',
      price: '$1.00',
    },
    {
      id: '2',
      name: 'Tether',
      symbol: 'USDT',
      apy: '5.0%',
      walletBalance: '0.00',
      borrowed: '0.00',
      available: '0.00',
      price: '$1.00',
    },
    {
      id: '3',
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      apy: '2.5%',
      walletBalance: '0.00',
      borrowed: '0.00',
      available: '0.00',
      price: '$65,000.00',
    },
    {
      id: '4',
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      apy: '3.0%',
      walletBalance: '0.00',
      borrowed: '0.00',
      available: '0.00',
      price: '$3,500.00',
    },
  ];

  const assets = type === 'supply' ? supplyAssets : borrowAssets;

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
          {assets.map((asset) => (
            <tr key={asset.id} className="border-b border-gray-800">
              <td className="py-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    {asset.symbol.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-sm text-gray-400">{asset.symbol}</div>
                  </div>
                </div>
              </td>
              <td className="py-4">
                <div className="font-medium">{asset.apy}</div>
              </td>
              <td className="py-4">
                <div className="font-medium">{asset.walletBalance}</div>
                <div className="text-sm text-gray-400">${asset.walletBalance}</div>
              </td>
              {type === 'supply' ? (
                <>
                  <td className="py-4">
                    <div className="font-medium">{asset.supplied}</div>
                    <div className="text-sm text-gray-400">${asset.supplied}</div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-6 bg-gray-700 rounded-full relative mr-2">
                        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-accent"></div>
                      </div>
                      <span className="text-sm">{asset.liquidationThreshold}</span>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  <td className="py-4">
                    <div className="font-medium">{asset.borrowed}</div>
                    <div className="text-sm text-gray-400">${asset.borrowed}</div>
                  </td>
                  <td className="py-4">
                    <div className="font-medium">{asset.available}</div>
                    <div className="text-sm text-gray-400">${asset.available}</div>
                  </td>
                </>
              )}
              <td className="py-4 text-right">
                <button className="btn-primary hover:bg-accent hover:text-white transition-all">
                  {type === 'supply' ? 'Supply' : 'Borrow'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssetList;