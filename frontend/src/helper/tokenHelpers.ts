import { prepareContractCall, sendTransaction, readContract } from 'thirdweb';
import { Account } from 'thirdweb/wallets';
import { cirqaTokenContract, usdtTokenContract, cirqaCore } from '@/lib/contracts';

// Types for token operations
export interface ApproveTokenParams {
    spender: string;
    amount: bigint;
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
 * Approve USDT spending for Core contract
 */
export async function approveUSDT(params: { amount: bigint; account: Account }): Promise<string> {
    try {
        const { amount, account } = params;

        const transaction = prepareContractCall({
            contract: usdtTokenContract,
            method: "function approve(address spender, uint256 amount) returns (bool)",
            params: [cirqaCore.address, amount]
        });

        const result = await sendTransaction({
            transaction,
            account
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error approving USDT:', error);
        throw new Error(`Failed to approve USDT: ${error instanceof Error ? error.message : 'Unknown error'}`);
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