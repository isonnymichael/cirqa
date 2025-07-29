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
import WithdrawModal from './WithdrawModal';
import RepayModal from './RepayModal';
import { FaInfoCircle } from 'react-icons/fa';

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

const AssetRow = ({ asset, type, onSupply, onBorrow, onWithdraw, onRepay, onCollateralToggle }: { 
  asset: Asset, 
  type: 'supply' | 'borrow', 
  onSupply: () => void, 
  onBorrow: () => void, 
  onWithdraw: () => void,
  onRepay: () => void,
  onCollateralToggle: (pid: bigint, enabled: boolean) => Promise<void> 
}) => {
  const { name, symbol, decimals, walletBalance, supplied, borrowed, allocPoint, totalAllocPoint, collateralEnabled } = asset;
  const [collateralLoading, setCollateralLoading] = useState(false);

  let shareOfPool = null;
  if (allocPoint && totalAllocPoint && totalAllocPoint > BigInt(0)) {
    shareOfPool = type === 'supply'
      ? Number(allocPoint) / Number(totalAllocPoint) * 100
      : Number(allocPoint) / Number(totalAllocPoint) * 100 / 2;
  }

  const handleToggleCollateral = async () => {
    try {
      setCollateralLoading(true);
      await onCollateralToggle(asset.pid, !collateralEnabled);
    } catch (error) {
      console.error('Failed to toggle collateral', error);
    } finally {
      setCollateralLoading(false);
    }
  };

  return (
    <tr className="border-b border-gray-800">
      <td className="py-3 lg:py-4">
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
      <td className="py-3 lg:py-4">
        <div className="font-medium">{shareOfPool !== null ? `${shareOfPool.toFixed(2)}%` : 'N/A'}</div>
      </td>
      <td className="py-3 lg:py-4">
        <div className="font-medium">{formatDisplayValue(walletBalance, decimals)}</div>
        <div className="text-sm text-gray-400">{symbol}</div>
      </td>
      {type === 'supply' ? (
        <>
          <td className="py-3 lg:py-4">
            <div className="font-medium">{formatDisplayValue(supplied, decimals)}</div>
            <div className="text-sm text-gray-400">{symbol}</div>
          </td>
          <td className="py-3 lg:py-4">
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
          <td className="py-3 lg:py-4">
            <div className="font-medium">{formatDisplayValue(borrowed, decimals)}</div>
            <div className="text-sm text-gray-400">{symbol}</div>
          </td>
          <td className="py-3 lg:py-4">
            <div className="font-medium">
              {type === 'borrow' && asset.collateralEnabled === false
                ? formatDisplayValue(BigInt(0), decimals)
                : formatDisplayValue(asset.available, decimals)}
            </div>
            <div className="text-sm text-gray-400">{symbol}</div>
          </td>
        </>
      )}
      <td className="py-3 lg:py-4 text-right">
        {type === 'supply' ? (
          <div className="flex justify-end space-x-2">
            <button
              onClick={onSupply}
              className="btn-primary transition-all cursor-pointer hover:bg-accent hover:text-white py-1.5 px-3 text-sm lg:py-2 lg:px-4 lg:text-base"
            >
              Supply
            </button>
            {asset.supplied > BigInt(0) && (
              <button
                onClick={onWithdraw}
                className="btn-secondary transition-all cursor-pointer hover:bg-accent hover:text-white py-1.5 px-3 text-sm lg:py-2 lg:px-4 lg:text-base"
              >
                Withdraw
              </button>
            )}
          </div>
        ) : (
          <div className="flex justify-end space-x-2">
            <button
              onClick={onBorrow}
              disabled={Number(asset.available) === 0}
              className={`
                btn-primary transition-all py-1.5 px-3 text-sm lg:py-2 lg:px-4 lg:text-base
                ${Number(asset.available) === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-accent hover:text-white'}
              `}
            >
              Borrow
            </button>
            {asset.borrowed > BigInt(0) && (
              <button
                onClick={onRepay}
                className="btn-secondary transition-all cursor-pointer hover:bg-accent hover:text-white py-1.5 px-3 text-sm lg:py-2 lg:px-4 lg:text-base"
              >
                Repay
              </button>
            )}
          </div>
        )}
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
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const { mutate: sendTransaction } = useSendTransaction();

  // Function to update a specific asset without reloading all assets
  const updateSingleAsset = async (assetToUpdate: Asset) => {
    if (!account?.address) return;
    
    try {
      console.log(`Updating single asset: ${assetToUpdate.symbol}`);
      
      // Use non-blocking delay to ensure blockchain data is updated while keeping UI responsive
      setTimeout(async () => {
        try {
          const pid = assetToUpdate.pid;
          const assetContract = getContract({ 
            client: cirqaProtocolContract.client, 
            chain: kiiTestnet, 
            address: assetToUpdate.assetAddress 
          });
          
          // Get updated user data
          const [balance, userInfo, isCollateral] = await Promise.all([
            readContract({ 
              contract: assetContract, 
              method: 'function balanceOf(address) view returns (uint256)', 
              params: [account.address] 
            }),
            readContract({ 
              contract: cirqaProtocolContract, 
              method: 'function userInfo(uint256, address) view returns (uint256 supplied, uint256 borrowed)', 
              params: [pid, account.address] 
            }),
            readContract({ 
              contract: cirqaProtocolContract, 
              method: 'function isCollateral(uint256,address) view returns (bool)', 
              params: [pid, account.address] 
            })
          ]);
          
          // Update asset data
          const updatedAsset = { ...assetToUpdate };
          updatedAsset.walletBalance = balance;
          updatedAsset.supplied = userInfo[0];
          updatedAsset.borrowed = userInfo[1];
          updatedAsset.collateralEnabled = isCollateral;
          
          // Always update available amount for borrowable assets
          try {
            // Get the contract balance (total available in the protocol)
            const contractBalance = await readContract({ 
              contract: assetContract, 
              method: 'function balanceOf(address) view returns (uint256)', 
              params: [cirqaProtocolContract.address] 
            });
            
            // Get total borrowed for this asset from the protocol
            const assetTotalInfo = await readContract({
              contract: cirqaProtocolContract,
              method: 'function assetInfo(uint256) view returns (address,uint256,uint256,uint256,uint256,uint256,uint256)',
              params: [pid]
            });
            
            // The 6th item (index 5) in the returned array is totalBorrowed
            const totalBorrowed = assetTotalInfo[6] || BigInt(0);
            
            // Calculate available = contract balance + total borrowed - user borrowed
            updatedAsset.available = contractBalance + totalBorrowed - updatedAsset.borrowed;
          } catch (e) {
            console.error(`Failed to update available balance for asset ${assetToUpdate.symbol}:`, e);
          }
          
          // Update the assets array with the new data
          setAssets(prevAssets => {
            return prevAssets.map(asset => 
              asset.pid === pid ? updatedAsset : asset
            );
          });
          
          console.log(`Asset ${assetToUpdate.symbol} updated successfully:`, updatedAsset);
        } catch (error) {
          console.error(`Failed to update asset ${assetToUpdate.symbol} after delay:`, error);
        }
      }, 2000);
      
    } catch (error) {
      console.error(`Failed to update asset ${assetToUpdate.symbol}:`, error);
    }
  };

  const fetchAllAssets = async () => {
    if (!assetLength) return;
    setIsLoading(true);
    setIsRefreshing(true); // Set refreshing state to show loading indicator if needed
    try {
      console.log('Fetching assets data...');
      const assetsData = await Promise.all(
        [...Array(Number(assetLength))].map(async (_, i) => {
          const pid = BigInt(i);
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
              try {
                const [balance, userInfo, isCollateral] = await Promise.all([
                  readContract({ contract: assetContract, method: 'function balanceOf(address) view returns (uint256)', params: [account.address] }),
                  readContract({ contract: cirqaProtocolContract, method: 'function userInfo(uint256, address) view returns (uint256 supplied, uint256 borrowed)', params: [pid, account.address] }),
                  readContract({ contract: cirqaProtocolContract, method: 'function isCollateral(uint256,address) view returns (bool)', params: [pid, account.address] })
                ]);
                walletBalance = balance;
                supplied = userInfo[0];
                borrowed = userInfo[1];
                collateralEnabled = isCollateral;

                // Always calculate available amount for all assets
                try {
                  // Get the contract balance (total available in the protocol)
                  const contractBalance = await readContract({ 
                    contract: assetContract, 
                    method: 'function balanceOf(address) view returns (uint256)', 
                    params: [cirqaProtocolContract.address] 
                  });
                  
                  // Get total borrowed for this asset from the protocol
                  const assetTotalInfo = await readContract({
                    contract: cirqaProtocolContract,
                    method: 'function assetInfo(uint256) view returns (address,uint256,uint256,uint256,uint256,uint256,uint256)',
                    params: [pid]
                  });
                  
                  // The 6th item (index 5) in the returned array is totalBorrowed
                  const totalBorrowed = assetTotalInfo[6] || BigInt(0);
                  
                  // Calculate available = contract balance + total borrowed - user borrowed
                  available = contractBalance + totalBorrowed - borrowed;
                } catch (e) {
                  console.error(`Failed to get available balance for asset ${symbol}:`, e);
                  available = BigInt(0);
                }
              } catch (e) {
                console.error(`Failed to get user data for asset ${assetAddress}:`, e);
              }
            }

            return { pid, assetAddress, name, symbol, decimals, walletBalance, supplied, borrowed, allocPoint, totalAllocPoint, available, collateralEnabled };
          } catch (e) {
            console.error(`Failed to process asset ${i}:`, e);
            return null;
          }
        })
      );
      // Filter out any null values from failed asset fetches
      const validAssetsData = assetsData.filter(asset => asset !== null) as Asset[];
      console.log('Assets data fetched successfully:', validAssetsData);
      setAssets(validAssetsData);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false); // Reset refreshing state
    }
  };

  // Track when type changes to refresh data
  useEffect(() => {
    if (!assetLength) return;
    
    // Fetch assets data when dependencies change or when tab (type) changes
    fetchAllAssets();
    
    // No polling interval - better practice
  }, [assetLength, account, type]);
  
  // Keep isRefreshing state for loading indicator if needed elsewhere
  const [isRefreshing, setIsRefreshing] = useState(false);

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
        onSuccess: (receipt) => {
          console.log(receipt);
          // Find the asset that was toggled
          const assetToUpdate = assets.find(asset => asset.pid === pid);
          if (assetToUpdate) {
            // Update the asset locally without reading from contract
            const updatedAsset = { ...assetToUpdate };
            updatedAsset.collateralEnabled = enabled;
            
            // Update the assets array with the new data
            setAssets(prevAssets => {
              return prevAssets.map(asset => 
                asset.pid === pid ? updatedAsset : asset
              );
            });
            
            console.log(`Asset ${assetToUpdate.symbol} collateral status updated locally to ${enabled}`);
            
            // Resolve immediately since we're not waiting for contract reads
            resolve();
          } else {
            resolve();
          }
        },
        onError: (error) => {
          console.error('Collateral toggle failed', error);
          reject(error);
        },
      });
    });
  };

  // Filter assets based on type
  const filteredAssets = assets.filter(asset => {
    if (type === 'supply') {
      // For supply view, show all assets
      return true;
    } else if (type === 'borrow') {
      // For borrow view, show all assets
      return true;
    }
    return true;
  });

  return (
    <div className="overflow-x-auto px-1 sm:px-0">
      {/* Desktop view - Table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
              <tr className="text-left text-gray-400 border-b border-gray-800">
                <th className="pb-3 lg:pb-4">Asset</th>
                <th className="pb-3 lg:pb-4">
                  <div className="flex items-center">
                    <div className="mr-1">{type === 'supply' ? 'Pool %' : 'Pool %'}</div>
                    <div className="relative">
                      <FaInfoCircle 
                        className="text-gray-400 hover:text-white cursor-pointer" 
                        size={14} 
                        onMouseEnter={(e) => {
                          const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                          if (tooltip) tooltip.style.display = 'block';
                        }}
                        onMouseLeave={(e) => {
                          const tooltip = e.currentTarget.nextElementSibling as HTMLElement;
                          if (tooltip) tooltip.style.display = 'none';
                        }}
                      />
                      <div 
                        className="absolute left-0 top-full mt-2 w-64 bg-gray-800 text-white text-xs rounded p-2 shadow-lg z-10"
                        style={{ display: 'none' }}
                      >
                        {type === 'supply' 
                          ? 'Pool% represents the percentage of CRQ rewards allocated to this asset. Supply pools receive the full allocation percentage of rewards.'
                          : 'Pool% represents the percentage of CRQ rewards allocated to this asset. Borrow pools receive half the allocation percentage of rewards compared to supply pools.'}
                      </div>
                    </div>
                  </div>
                </th>
                <th className="pb-3 lg:pb-4">Wallet Balance</th>
                {type === 'supply' ? (
                  <>
                    <th className="pb-3 lg:pb-4">Supplied</th>
                    <th className="pb-3 lg:pb-4">Collateral</th>
                  </>
                ) : (
                  <>
                    <th className="pb-3 lg:pb-4">Borrowed</th>
                    <th className="pb-3 lg:pb-4">Available</th>
                  </>
                )}
                <th className="pb-3 lg:pb-4"></th>
              </tr>
            </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-6">
                  <div className="flex justify-center">
                    <Spinner />
                  </div>
                </td>
              </tr>
            ) : filteredAssets.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-gray-400">No assets available.</td></tr>
            ) : (
              filteredAssets.map((asset) => (
                <AssetRow
                  key={asset.pid}
                  asset={asset}
                  type={type}
                  onSupply={() => {
                    setSelectedAsset(asset);
                    setIsSupplyModalOpen(true);
                  }}
                  onBorrow={() => {
                    setSelectedAsset(asset);
                    setIsBorrowModalOpen(true);
                  }}
                  onWithdraw={() => {
                    setSelectedAsset(asset);
                    setIsWithdrawModalOpen(true);
                  }}
                  onRepay={() => {
                    setSelectedAsset(asset);
                    setIsRepayModalOpen(true);
                  }}
                  onCollateralToggle={handleCollateralToggle}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Mobile view - Cards */}
      <div className="md:hidden">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-6 text-gray-400">No assets available.</div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredAssets.map((asset) => {
              const { name, symbol, decimals, walletBalance, supplied, borrowed, allocPoint, totalAllocPoint, collateralEnabled } = asset;
              let shareOfPool = null;
              if (allocPoint && totalAllocPoint && totalAllocPoint > BigInt(0)) {
                shareOfPool = type === 'supply'
                  ? Number(allocPoint) / Number(totalAllocPoint) * 100
                  : Number(allocPoint) / Number(totalAllocPoint) * 100 / 2;
              }
              
              return (
                <div key={asset.pid} className="bg-gray-900 rounded-lg p-3 sm:p-4 border border-gray-800 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center space-x-2">
                       <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-700 text-xs rounded-full flex items-center justify-center">
                         {typeof symbol === 'string' ? symbol.charAt(0) : '?'}
                       </div>
                       <div>
                         <div className="font-medium text-sm sm:text-base">{name}</div>
                         <div className="text-xs sm:text-sm text-gray-400">{symbol}</div>
                       </div>
                     </div>
                     <div>
                       <div className="text-xs sm:text-sm text-gray-400">Pool %</div>
                       <div className="text-sm sm:text-base font-medium text-right">{shareOfPool !== null ? `${shareOfPool.toFixed(2)}%` : 'N/A'}</div>
                     </div>
                   </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
                     <div>
                       <div className="text-xs sm:text-sm text-gray-400">Wallet Balance</div>
                       <div className="text-sm sm:text-base font-medium">{formatDisplayValue(walletBalance, decimals)}</div>
                       <div className="text-xs text-gray-400">{symbol}</div>
                     </div>
                     
                     {type === 'supply' ? (
                       <div>
                         <div className="text-xs sm:text-sm text-gray-400">Supplied</div>
                         <div className="text-sm sm:text-base font-medium">{formatDisplayValue(supplied, decimals)}</div>
                         <div className="text-xs text-gray-400">{symbol}</div>
                       </div>
                     ) : (
                       <div>
                         <div className="text-xs sm:text-sm text-gray-400">Borrowed</div>
                         <div className="text-sm sm:text-base font-medium">{formatDisplayValue(borrowed, decimals)}</div>
                         <div className="text-xs text-gray-400">{symbol}</div>
                       </div>
                     )}
                   </div>
                  
                  {type === 'supply' ? (
                     <div className="flex items-center mb-3">
                       <div className="text-xs sm:text-sm text-gray-400 mr-2">Collateral</div>
                       <button
                         className={`cursor-pointer w-9 sm:w-10 h-5 sm:h-6 rounded-full relative mr-2 ${collateralEnabled ? 'bg-green-500' : 'bg-gray-700'}`}
                         onClick={async () => {
                           try {
                             await handleCollateralToggle(asset.pid, !collateralEnabled);
                           } catch (error) {
                             console.error('Failed to toggle collateral', error);
                           }
                         }}
                       >
                         <div className={`absolute left-1 top-1 w-3 sm:w-4 h-3 sm:h-4 rounded-full transition-all duration-200 ${collateralEnabled ? 'bg-white left-5 sm:left-5' : 'bg-white'}`}></div>
                       </button>
                     </div>
                   ) : (
                     <div className="mb-3">
                       <div className="text-xs sm:text-sm text-gray-400">Available</div>
                       <div className="text-sm sm:text-base font-medium">
                         {type === 'borrow' && asset.collateralEnabled === false
                           ? formatDisplayValue(BigInt(0), decimals)
                           : formatDisplayValue(asset.available, decimals)}
                       </div>
                       <div className="text-xs text-gray-400">{symbol}</div>
                     </div>
                   )}
                  
                  <div className="flex space-x-2 mt-3">
                     {type === 'supply' ? (
                       <>
                         <button
                           onClick={() => {
                             setSelectedAsset(asset);
                             setIsSupplyModalOpen(true);
                           }}
                           className="btn-primary flex-1 transition-all cursor-pointer hover:bg-accent hover:text-white text-center py-1.5 sm:py-2 text-sm sm:text-base rounded-md"
                         >
                           Supply
                         </button>
                         {asset.supplied > BigInt(0) && (
                           <button
                             onClick={() => {
                               setSelectedAsset(asset);
                               setIsWithdrawModalOpen(true);
                             }}
                             className="btn-secondary flex-1 transition-all cursor-pointer hover:bg-accent hover:text-white text-center py-1.5 sm:py-2 text-sm sm:text-base rounded-md"
                           >
                             Withdraw
                           </button>
                         )}
                       </>
                     ) : (
                       <>
                         <button
                           onClick={() => {
                             setSelectedAsset(asset);
                             setIsBorrowModalOpen(true);
                           }}
                           disabled={Number(asset.available) === 0}
                           className={`
                             btn-primary flex-1 transition-all text-center py-1.5 sm:py-2 text-sm sm:text-base rounded-md
                             ${Number(asset.available) === 0
                               ? 'opacity-50 cursor-not-allowed'
                               : 'cursor-pointer hover:bg-accent hover:text-white'}
                           `}
                         >
                           Borrow
                         </button>
                         {asset.borrowed > BigInt(0) && (
                           <button
                             onClick={() => {
                               setSelectedAsset(asset);
                               setIsRepayModalOpen(true);
                             }}
                             className="btn-secondary flex-1 transition-all cursor-pointer hover:bg-accent hover:text-white text-center py-1.5 sm:py-2 text-sm sm:text-base rounded-md"
                           >
                             Repay
                           </button>
                         )}
                       </>
                     )}
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedAsset && (
        <>
          <SupplyModal
            isOpen={isSupplyModalOpen}
            onClose={() => setIsSupplyModalOpen(false)}
            asset={selectedAsset}
            onSuccess={() => {
              if (selectedAsset) {
                updateSingleAsset(selectedAsset);
              }
            }}
          />
          <BorrowModal
            isOpen={isBorrowModalOpen}
            onClose={() => setIsBorrowModalOpen(false)}
            asset={selectedAsset}
            onSuccess={() => {
              if (selectedAsset) {
                updateSingleAsset(selectedAsset);
              }
            }}
          />
          <WithdrawModal
            isOpen={isWithdrawModalOpen}
            onClose={() => setIsWithdrawModalOpen(false)}
            asset={selectedAsset}
            onSuccess={() => {
              if (selectedAsset) {
                updateSingleAsset(selectedAsset);
              }
            }}
          />
          <RepayModal
            isOpen={isRepayModalOpen}
            onClose={() => setIsRepayModalOpen(false)}
            asset={selectedAsset}
            onSuccess={() => {
              if (selectedAsset) {
                updateSingleAsset(selectedAsset);
              }
            }}
          />
        </>
      )}
    </div>
  );
};

export default AssetList;