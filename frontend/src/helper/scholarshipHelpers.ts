import { PreparedTransaction, getContract, prepareContractCall, sendTransaction, readContract } from 'thirdweb';
import { Account } from 'thirdweb/wallets';
import { cirqaCore, cirqaTokenContract, usdtTokenContract, scholarshipManagerContract } from '@/lib/contracts';

// Types for scholarship data
export interface ScholarshipData {
    tokenId: number;
    student: string;
    metadata: string;
    balance: bigint;
    totalFunded: bigint;
    totalWithdrawn: bigint;
}

export interface WithdrawalHistory {
    amounts: bigint[];
    timestamps: bigint[];
}

export interface CreateScholarshipParams {
    metadata: string;
    account: Account;
}

export interface FundScholarshipParams {
    tokenId: number;
    amount: bigint;
    account: Account;
}

export interface WithdrawFundsParams {
    tokenId: number;
    amount: bigint;
    account: Account;
}

/**
 * Create a new scholarship NFT for a student
 */
export async function createScholarship(params: CreateScholarshipParams): Promise<string> {
    try {
        const { metadata, account } = params;

        const transaction = prepareContractCall({
            contract: cirqaCore,
            method: "function createScholarship(string memory metadata) external returns (uint256)",
            params: [metadata]
        });

        const result = await sendTransaction({
            transaction,
            account
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error creating scholarship:', error);
        throw new Error(`Failed to create scholarship: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Fund a scholarship with USDT
 */
export async function fundScholarship(params: FundScholarshipParams): Promise<string> {
    try {
        const { tokenId, amount, account } = params;

        // First, check if we need to approve USDT spending
        const currentAllowance = await readContract({
            contract: usdtTokenContract,
            method: "function allowance(address owner, address spender) view returns (uint256)",
            params: [account.address, cirqaCore.address]
        });

        // If allowance is insufficient, approve first
        if (currentAllowance < amount) {
            const approveTransaction = prepareContractCall({
                contract: usdtTokenContract,
                method: "function approve(address spender, uint256 amount) returns (bool)",
                params: [cirqaCore.address, amount]
            });

            await sendTransaction({
                transaction: approveTransaction,
                account
            });
        }

        // Now fund the scholarship
        const fundTransaction = prepareContractCall({
            contract: cirqaCore,
            method: "function fundScholarship(uint256 tokenId, uint256 amount) external",
            params: [BigInt(tokenId), amount]
        });

        const result = await sendTransaction({
            transaction: fundTransaction,
            account
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error funding scholarship:', error);
        throw new Error(`Failed to fund scholarship: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Withdraw funds from a scholarship (student only)
 */
export async function withdrawFunds(params: WithdrawFundsParams): Promise<string> {
    try {
        const { tokenId, amount, account } = params;

        const transaction = prepareContractCall({
            contract: cirqaCore,
            method: "function withdrawFunds(uint256 tokenId, uint256 amount) external",
            params: [BigInt(tokenId), amount]
        });

        const result = await sendTransaction({
            transaction,
            account
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error withdrawing funds:', error);
        throw new Error(`Failed to withdraw funds: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get scholarships owned by a specific student
 */
export async function getScholarshipsByStudent(studentAddress: string): Promise<number[]> {
    try {
        const scholarshipManager = scholarshipManagerContract;

        const scholarships = await readContract({
            contract: scholarshipManager,
            method: "function getScholarshipsByStudent(address student) view returns (uint256[])",
            params: [studentAddress]
        });

        return scholarships.map((id: bigint) => Number(id));
    } catch (error) {
        console.error('Error getting scholarships by student:', error);
        throw new Error(`Failed to get scholarships: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get all scholarships in the system
 */
export async function getAllScholarships(): Promise<number[]> {
    try {
        const scholarshipManager = scholarshipManagerContract;

        const scholarships = await readContract({
            contract: scholarshipManager,
            method: "function getAllScholarships() view returns (uint256[])",
            params: []
        });

        return scholarships.map((id: bigint) => Number(id));
    } catch (error) {
        console.error('Error getting all scholarships:', error);
        throw new Error(`Failed to get all scholarships: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Check if a scholarship has enough balance for withdrawal
 */
export async function hasEnoughBalance(tokenId: number, amount: bigint): Promise<boolean> {
    try {
        const scholarshipManager = scholarshipManagerContract;

        const hasBalance = await readContract({
            contract: scholarshipManager,
            method: "function hasEnoughBalance(uint256 tokenId, uint256 amount) view returns (bool)",
            params: [BigInt(tokenId), amount]
        });

        return hasBalance;
    } catch (error) {
        console.error('Error checking scholarship balance:', error);
        throw new Error(`Failed to check balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get withdrawal history for a scholarship
 */
export async function getWithdrawalHistory(tokenId: number): Promise<WithdrawalHistory> {
    try {
        const scholarshipManager = scholarshipManagerContract;

        const [amounts, timestamps] = await readContract({
            contract: scholarshipManager,
            method: "function getWithdrawalHistory(uint256 tokenId) view returns (uint256[], uint256[])",
            params: [BigInt(tokenId)]
        });

        return {
            amounts: amounts as bigint[],
            timestamps: timestamps as bigint[]
        };
    } catch (error) {
        console.error('Error getting withdrawal history:', error);
        throw new Error(`Failed to get withdrawal history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Check if an address is the student of a scholarship
 */
export async function isStudent(tokenId: number, address: string): Promise<boolean> {
    try {
        const scholarshipManager = scholarshipManagerContract;

        const result = await readContract({
            contract: scholarshipManager,
            method: "function isStudent(uint256 tokenId, address addr) view returns (bool)",
            params: [BigInt(tokenId), address]
        });

        return result;
    } catch (error) {
        console.error('Error checking if address is student:', error);
        throw new Error(`Failed to check student status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get scholarship metadata URI
 */
export async function getScholarshipMetadata(tokenId: number): Promise<string> {
    try {
        const uri = await readContract({
            contract: cirqaCore,
            method: "function tokenURI(uint256 tokenId) view returns (string)",
            params: [BigInt(tokenId)]
        });

        return uri;
    } catch (error) {
        console.error('Error getting scholarship metadata:', error);
        throw new Error(`Failed to get metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get the owner of a scholarship NFT
 */
export async function getScholarshipOwner(tokenId: number): Promise<string> {
    try {
        const owner = await readContract({
            contract: cirqaCore,
            method: "function ownerOf(uint256 tokenId) view returns (address)",
            params: [BigInt(tokenId)]
        });

        return owner;
    } catch (error) {
        console.error('Error getting scholarship owner:', error);
        throw new Error(`Failed to get owner: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get complete scholarship data (student, balance, metadata)
 */
export async function getScholarshipData(tokenId: number): Promise<ScholarshipData> {
    try {
        const [student, balance, metadata] = await readContract({
            contract: scholarshipManagerContract,
            method: "function getScholarshipData(uint256 tokenId) view returns (address, uint256, string)",
            params: [BigInt(tokenId)]
        });

        // Get withdrawal history to calculate total withdrawn
        const withdrawalHistory = await getWithdrawalHistory(tokenId);
        const totalWithdrawn = withdrawalHistory.amounts.reduce((sum, amount) => sum + amount, BigInt(0));
        
        // Calculate total funded (balance + total withdrawn)
        const totalFunded = balance + totalWithdrawn;

        return {
            tokenId,
            student: student as string,
            metadata: metadata as string,
            balance: balance as bigint,
            totalFunded,
            totalWithdrawn
        };
    } catch (error) {
        console.error('Error getting scholarship data:', error);
        throw new Error(`Failed to get scholarship data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}