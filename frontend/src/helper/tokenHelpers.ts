import { prepareContractCall, sendTransaction, readContract, waitForReceipt } from 'thirdweb';
import { Account } from 'thirdweb/wallets';
import { MaxUint256 } from 'ethers';
import { cirqaTokenContract, usdtTokenContract, cirqaCore, client, chain } from '@/lib/contracts';

// Types for token operations
export interface ApproveTokenParams {
    spender: string;
    account: Account;
}

export interface TransferTokenParams {
    to: string;
    amount: bigint;
    account: Account;
}

export interface TokenBalance {
    balance: bigint;
    decimals: number;
    symbol: string;
    name: string;
}

/**
 * Utility function to sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            
            if (i === maxRetries - 1) {
                throw lastError;
            }
            
            const delay = baseDelay * Math.pow(2, i);
            console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }
    
    throw lastError!;
}

/**
 * Get USDT token balance for an address
 */
export async function getUSDTBalance(address: string): Promise<bigint> {
    try {
        const balance = await readContract({
            contract: usdtTokenContract,
            method: "function balanceOf(address account) view returns (uint256)",
            params: [address]
        });

        return balance;
    } catch (error) {
        console.error('Error getting USDT balance:', error);
        throw new Error(`Failed to get USDT balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get Cirqa token balance for an address
 */
export async function getCirqaBalance(address: string): Promise<bigint> {
    try {
        const balance = await readContract({
            contract: cirqaTokenContract,
            method: "function balanceOf(address account) view returns (uint256)",
            params: [address]
        });

        return balance;
    } catch (error) {
        console.error('Error getting Cirqa balance:', error);
        throw new Error(`Failed to get Cirqa balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get USDT allowance for Core contract
 */
export async function getUSDTAllowance(owner: string): Promise<bigint> {
    try {
        const allowance = await readContract({
            contract: usdtTokenContract,
            method: "function allowance(address owner, address spender) view returns (uint256)",
            params: [owner, cirqaCore.address]
        });

        return allowance;
    } catch (error) {
        console.error('Error getting USDT allowance:', error);
        throw new Error(`Failed to get USDT allowance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Approve unlimited USDT spending for Core contract
 */
export async function approveUSDT(params: { account: Account }): Promise<string> {
    try {
        const { account } = params;

        console.log('🔄 Requesting USDT unlimited approval...');
        console.log('   Account:', account.address);
        console.log('   Spender:', cirqaCore.address);

        const transaction = prepareContractCall({
            contract: usdtTokenContract,
            method: "function approve(address spender, uint256 amount) returns (bool)",
            params: [cirqaCore.address, MaxUint256]
        });

        const result = await sendTransaction({
            transaction,
            account
        });

        console.log('✅ USDT approval transaction sent:', result.transactionHash);
        return result.transactionHash;
    } catch (error) {
        console.error('❌ Error approving USDT:', error);
        
        // Enhanced error handling
        if (error instanceof Error) {
            if (error.message.includes('user rejected')) {
                throw new Error('USDT approval was rejected by user.');
            } else if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient ETH balance for approval transaction.');
            } else {
                throw new Error(`Failed to approve USDT: ${error.message}`);
            }
        } else {
            throw new Error('Failed to approve USDT: Unknown error occurred');
        }
    }
}

/**
 * Approve unlimited Cirqa token spending for Core contract
 */
export async function approveCirqa(params: { account: Account }): Promise<string> {
    try {
        const { account } = params;

        console.log('🔄 Requesting CIRQA unlimited approval...');
        console.log('   Account:', account.address);
        console.log('   Spender:', cirqaCore.address);

        const transaction = prepareContractCall({
            contract: cirqaTokenContract,
            method: "function approve(address spender, uint256 amount) returns (bool)",
            params: [cirqaCore.address, MaxUint256]
        });

        const result = await sendTransaction({
            transaction,
            account
        });

        console.log('✅ CIRQA approval transaction sent:', result.transactionHash);
        return result.transactionHash;
    } catch (error) {
        console.error('❌ Error approving CIRQA:', error);
        
        // Enhanced error handling
        if (error instanceof Error) {
            if (error.message.includes('user rejected')) {
                throw new Error('CIRQA approval was rejected by user.');
            } else if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient ETH balance for approval transaction.');
            } else {
                throw new Error(`Failed to approve CIRQA: ${error.message}`);
            }
        } else {
            throw new Error('Failed to approve CIRQA: Unknown error occurred');
        }
    }
}

/**
 * Get Cirqa allowance for Core contract or ScoreManager
 */
export async function getCirqaAllowance(owner: string, spender: string): Promise<bigint> {
    try {
        const allowance = await readContract({
            contract: cirqaTokenContract,
            method: "function allowance(address owner, address spender) view returns (uint256)",
            params: [owner, spender]
        });

        return allowance;
    } catch (error) {
        console.error('Error getting Cirqa allowance:', error);
        throw new Error(`Failed to get Cirqa allowance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Check if unlimited approval is needed for USDT
 */
export async function needsUSDTApproval(owner: string, requiredAmount: bigint): Promise<boolean> {
    try {
        const allowance = await getUSDTAllowance(owner);
        // Consider approval needed if allowance is less than required amount
        // or if allowance is significantly less than MaxUint256 (to handle potential precision issues)
        return allowance < requiredAmount || allowance < (MaxUint256 / BigInt(2));
    } catch (error) {
        console.error('Error checking USDT approval needs:', error);
        return true; // Default to requiring approval if check fails
    }
}

/**
 * Check if unlimited approval is needed for Cirqa
 */
export async function needsCirqaApproval(owner: string, spender: string, requiredAmount: bigint): Promise<boolean> {
    try {
        const allowance = await getCirqaAllowance(owner, spender);
        // Consider approval needed if allowance is less than required amount
        // or if allowance is significantly less than MaxUint256 (to handle potential precision issues)
        return allowance < requiredAmount || allowance < (MaxUint256 / BigInt(2));
    } catch (error) {
        console.error('Error checking Cirqa approval needs:', error);
        return true; // Default to requiring approval if check fails
    }
}

/**
 * Auto-approve USDT if needed for a specific amount
 * Returns true if approval was successful or not needed
 */
export async function ensureUSDTApproval(params: { account: Account; requiredAmount: bigint }): Promise<boolean> {
    try {
        const { account, requiredAmount } = params;
        
        console.log('🔍 Checking USDT approval requirements...');
        console.log('   Account:', account.address);
        console.log('   Required amount:', requiredAmount.toString());
        
        // Check if approval is needed
        const needsApproval = await needsUSDTApproval(account.address, requiredAmount);
        
        if (needsApproval) {
            console.log('🔄 USDT approval needed, requesting unlimited approval...');
            
            const approveTransaction = prepareContractCall({
                contract: usdtTokenContract,
                method: "function approve(address spender, uint256 amount) returns (bool)",
                params: [cirqaCore.address, MaxUint256]
            });

            const approvalResult = await sendTransaction({
                transaction: approveTransaction,
                account
            });
            
            console.log('⏳ Waiting for USDT approval transaction to be confirmed...');
            
            try {
                // Wait for the approval transaction to be confirmed
                await waitForReceipt({
                    client,
                    chain,
                    transactionHash: approvalResult.transactionHash
                });
                
                console.log('✅ USDT unlimited approval confirmed on blockchain');
            } catch (receiptError) {
                console.warn('⚠️ Could not wait for receipt, but transaction was sent. Adding delay...');
                // Fallback: add a fixed delay to allow blockchain to process
                await sleep(3000); // 3 second delay
            }
            
            // Verify the allowance is actually updated with retry mechanism
            console.log('🔄 Verifying USDT allowance update...');
            const updatedAllowance = await retryWithBackoff(async () => {
                const allowance = await getUSDTAllowance(account.address);
                
                if (allowance < requiredAmount) {
                    throw new Error(`USDT allowance still insufficient: ${allowance.toString()} < ${requiredAmount.toString()}`);
                }
                
                return allowance;
            }, 5, 1000); // 5 retries with 1s base delay
            
            console.log('✅ USDT allowance verified:', updatedAllowance.toString());
            return true;
        }
        
        console.log('✅ USDT approval already sufficient');
        return true;
    } catch (error) {
        console.error('❌ Error ensuring USDT approval:', error);
        
        // Enhanced error handling
        if (error instanceof Error) {
            if (error.message.includes('user rejected')) {
                throw new Error('USDT approval was rejected by user.');
            } else if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient ETH balance for approval transaction.');
            } else {
                throw new Error(`Failed to ensure USDT approval: ${error.message}`);
            }
        } else {
            throw new Error('Failed to ensure USDT approval: Unknown error occurred');
        }
    }
}

/**
 * Auto-approve Cirqa if needed for a specific spender and amount
 * Returns true if approval was successful or not needed
 */
export async function ensureCirqaApproval(params: { account: Account; spender: string; requiredAmount: bigint }): Promise<boolean> {
    try {
        const { account, spender, requiredAmount } = params;
        
        console.log('🔍 Checking CIRQA approval requirements...');
        console.log('   Account:', account.address);
        console.log('   Spender:', spender);
        console.log('   Required amount:', requiredAmount.toString());
        
        // Check if approval is needed
        const needsApproval = await needsCirqaApproval(account.address, spender, requiredAmount);
        
        if (needsApproval) {
            console.log('🔄 CIRQA approval needed, requesting unlimited approval...');
            
            const approveTransaction = prepareContractCall({
                contract: cirqaTokenContract,
                method: "function approve(address spender, uint256 amount) returns (bool)",
                params: [spender, MaxUint256]
            });

            const approvalResult = await sendTransaction({
                transaction: approveTransaction,
                account
            });
            
            console.log('⏳ Waiting for CIRQA approval transaction to be confirmed...');
            
            try {
                // Wait for the approval transaction to be confirmed
                await waitForReceipt({
                    client,
                    chain,
                    transactionHash: approvalResult.transactionHash
                });
                
                console.log('✅ CIRQA unlimited approval confirmed on blockchain');
            } catch (receiptError) {
                console.warn('⚠️ Could not wait for receipt, but transaction was sent. Adding delay...');
                // Fallback: add a fixed delay to allow blockchain to process
                await sleep(3000); // 3 second delay
            }
            
            // Verify the allowance is actually updated with retry mechanism
            console.log('🔄 Verifying CIRQA allowance update...');
            const updatedAllowance = await retryWithBackoff(async () => {
                const allowance = await getCirqaAllowance(account.address, spender);
                
                if (allowance < requiredAmount) {
                    throw new Error(`CIRQA allowance still insufficient: ${allowance.toString()} < ${requiredAmount.toString()}`);
                }
                
                return allowance;
            }, 5, 1000); // 5 retries with 1s base delay
            
            console.log('✅ CIRQA allowance verified:', updatedAllowance.toString());
            return true;
        }
        
        console.log('✅ CIRQA approval already sufficient');
        return true;
    } catch (error) {
        console.error('❌ Error ensuring CIRQA approval:', error);
        
        // Enhanced error handling
        if (error instanceof Error) {
            if (error.message.includes('user rejected')) {
                throw new Error('CIRQA approval was rejected by user.');
            } else if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient ETH balance for approval transaction.');
            } else {
                throw new Error(`Failed to ensure CIRQA approval: ${error.message}`);
            }
        } else {
            throw new Error('Failed to ensure CIRQA approval: Unknown error occurred');
        }
    }
}

/**
 * Transfer USDT tokens
 */
export async function transferUSDT(params: TransferTokenParams): Promise<string> {
    try {
        const { to, amount, account } = params;

        const transaction = prepareContractCall({
            contract: usdtTokenContract,
            method: "function transfer(address to, uint256 amount) returns (bool)",
            params: [to, amount]
        });

        const result = await sendTransaction({
            transaction,
            account
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error transferring USDT:', error);
        throw new Error(`Failed to transfer USDT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Transfer Cirqa tokens
 */
export async function transferCirqa(params: TransferTokenParams): Promise<string> {
    try {
        const { to, amount, account } = params;

        const transaction = prepareContractCall({
            contract: cirqaTokenContract,
            method: "function transfer(address to, uint256 amount) returns (bool)",
            params: [to, amount]
        });

        const result = await sendTransaction({
            transaction,
            account
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error transferring Cirqa:', error);
        throw new Error(`Failed to transfer Cirqa: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get complete token information for USDT
 */
export async function getUSDTInfo(): Promise<TokenBalance & { decimals: number; symbol: string; name: string }> {
    try {
        const [name, symbol, decimals] = await Promise.all([
            readContract({
                contract: usdtTokenContract,
                method: "function name() view returns (string)",
                params: []
            }),
            readContract({
                contract: usdtTokenContract,
                method: "function symbol() view returns (string)",
                params: []
            }),
            readContract({
                contract: usdtTokenContract,
                method: "function decimals() view returns (uint8)",
                params: []
            })
        ]);

        return {
            balance: BigInt(0), // Will be filled by caller if needed
            name,
            symbol,
            decimals: Number(decimals)
        };
    } catch (error) {
        console.error('Error getting USDT info:', error);
        throw new Error(`Failed to get USDT info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get complete token information for Cirqa
 */
export async function getCirqaInfo(): Promise<TokenBalance & { decimals: number; symbol: string; name: string }> {
    try {
        const [name, symbol, decimals] = await Promise.all([
            readContract({
                contract: cirqaTokenContract,
                method: "function name() view returns (string)",
                params: []
            }),
            readContract({
                contract: cirqaTokenContract,
                method: "function symbol() view returns (string)",
                params: []
            }),
            readContract({
                contract: cirqaTokenContract,
                method: "function decimals() view returns (uint8)",
                params: []
            })
        ]);

        return {
            balance: BigInt(0), // Will be filled by caller if needed
            name,
            symbol,
            decimals: Number(decimals)
        };
    } catch (error) {
        console.error('Error getting Cirqa info:', error);
        throw new Error(`Failed to get Cirqa info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get both token balances for an address
 */
export async function getAllTokenBalances(address: string): Promise<{
    usdt: TokenBalance;
    cirqa: TokenBalance;
}> {
    try {
        const [usdtBalance, cirqaBalance, usdtInfo, cirqaInfo] = await Promise.all([
            getUSDTBalance(address),
            getCirqaBalance(address),
            getUSDTInfo(),
            getCirqaInfo()
        ]);

        return {
            usdt: {
                ...usdtInfo,
                balance: usdtBalance
            },
            cirqa: {
                ...cirqaInfo,
                balance: cirqaBalance
            }
        };
    } catch (error) {
        console.error('Error getting all token balances:', error);
        throw new Error(`Failed to get token balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Check if user has enough USDT balance for an operation
 */
export async function hasEnoughUSDTBalance(address: string, requiredAmount: bigint): Promise<boolean> {
    try {
        const balance = await getUSDTBalance(address);
        return balance >= requiredAmount;
    } catch (error) {
        console.error('Error checking USDT balance:', error);
        return false;
    }
}

/**
 * Format token amount based on decimals
 */
export function formatTokenAmount(amount: bigint, decimals: number): string {
    const divisor = BigInt(10 ** decimals);
    const quotient = amount / divisor;
    const remainder = amount % divisor;
    
    if (remainder === BigInt(0)) {
        return quotient.toString();
    }
    
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmedRemainder = remainderStr.replace(/0+$/, '');
    
    if (trimmedRemainder === '') {
        return quotient.toString();
    }
    
    return `${quotient}.${trimmedRemainder}`;
}

/**
 * Parse token amount string to bigint based on decimals
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
    const [whole, fractional = ''] = amount.split('.');
    const fractionalPadded = fractional.padEnd(decimals, '0').slice(0, decimals);
    const combinedStr = whole + fractionalPadded;
    return BigInt(combinedStr);
}