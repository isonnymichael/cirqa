import { PreparedTransaction, getContract, prepareContractCall, sendTransaction, readContract, waitForReceipt } from 'thirdweb';
import { Account } from 'thirdweb/wallets';
import { MaxUint256 } from 'ethers';
import { cirqaCore, cirqaTokenContract, usdtTokenContract, scholarshipManagerContract, client, chain } from '@/lib/contracts';

// Types for scholarship data
export interface ScholarshipData {
    tokenId: number;
    student: string;
    metadata: string;
    balance: bigint;
    totalFunded: bigint;
    totalWithdrawn: bigint;
    frozen: boolean; // New field for freeze status
}

export interface WithdrawalHistory {
    amounts: bigint[];
    timestamps: bigint[];
}

// New types for enhanced withdrawal history
export interface DetailedWithdrawalHistory {
    netAmounts: bigint[];
    timestamps: bigint[];
    feeAmounts: bigint[];
}

// New types for investor tracking
export interface InvestorInfo {
    address: string;
    contribution: bigint;
}

export interface ScholarshipFunding {
    totalFunding: bigint;
    investorCount: number;
    investors: string[];
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
 * Create a new scholarship NFT for a student
 */
export async function createScholarship(params: CreateScholarshipParams): Promise<string> {
    try {
        const { metadata, account } = params;

        console.log('CreateScholarship Helper - Input params:', params);
        console.log('CreateScholarship Helper - Metadata:', metadata);
        console.log('CreateScholarship Helper - Metadata type:', typeof metadata);
        console.log('CreateScholarship Helper - Metadata length:', metadata?.length);
        console.log('CreateScholarship Helper - Account:', account?.address);

        // Validate input
        if (!metadata || typeof metadata !== 'string') {
            throw new Error(`Invalid metadata provided: ${metadata}. Expected string.`);
        }

        if (!account) {
            throw new Error('No account provided for transaction signing.');
        }

        const transaction = prepareContractCall({
            contract: cirqaCore,
            method: "function createScholarship(string memory metadata) external returns (uint256)",
            params: [metadata]
        });

        console.log('CreateScholarship Helper - Transaction prepared with params:', [metadata]);

        const result = await sendTransaction({
            transaction,
            account
        });

        console.log('CreateScholarship Helper - Transaction result:', result);
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

        console.log('🎯 Starting fund scholarship process...');
        console.log('   Account:', account.address);
        console.log('   Token ID:', tokenId);
        console.log('   Amount:', amount.toString());

        // First, check if we need to approve USDT spending
        console.log('🔍 Checking current USDT allowance...');
        const currentAllowance = await readContract({
            contract: usdtTokenContract,
            method: "function allowance(address owner, address spender) view returns (uint256)",
            params: [account.address, cirqaCore.address]
        });

        console.log('📊 Current allowance:', currentAllowance.toString());
        console.log('📊 Required amount:', amount.toString());

        // If allowance is insufficient, approve unlimited amount
        if (currentAllowance < amount) {
            console.log('🔄 Current allowance insufficient, requesting unlimited approval...');
            
            const approveTransaction = prepareContractCall({
                contract: usdtTokenContract,
                method: "function approve(address spender, uint256 amount) returns (bool)",
                params: [cirqaCore.address, MaxUint256]
            });

            const approvalResult = await sendTransaction({
                transaction: approveTransaction,
                account
            });
            
            console.log('⏳ Waiting for approval transaction to be confirmed...');
            
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
            
            // Double-check the allowance is actually updated with retry mechanism
            console.log('🔄 Verifying allowance update...');
            const updatedAllowance = await retryWithBackoff(async () => {
                const allowance = await readContract({
                    contract: usdtTokenContract,
                    method: "function allowance(address owner, address spender) view returns (uint256)",
                    params: [account.address, cirqaCore.address]
                });
                
                if (allowance < amount) {
                    throw new Error(`Allowance still insufficient: ${allowance.toString()} < ${amount.toString()}`);
                }
                
                return allowance;
            }, 5, 1000); // 5 retries with 1s base delay
            
            console.log('✅ Updated allowance verified:', updatedAllowance.toString());
        }

        // Final allowance check before funding
        console.log('🔍 Final allowance verification before funding...');
        const finalAllowance = await readContract({
            contract: usdtTokenContract,
            method: "function allowance(address owner, address spender) view returns (uint256)",
            params: [account.address, cirqaCore.address]
        });
        
        if (finalAllowance < amount) {
            throw new Error(`Final allowance check failed: ${finalAllowance.toString()} < ${amount.toString()}`);
        }
        
        console.log('✅ Final allowance check passed:', finalAllowance.toString());

        // Now fund the scholarship
        console.log('🎯 Preparing fund transaction...');
        console.log('   Token ID:', tokenId);
        console.log('   Amount:', amount.toString());
        
        const fundTransaction = prepareContractCall({
            contract: cirqaCore,
            method: "function fundScholarship(uint256 tokenId, uint256 amount) external",
            params: [BigInt(tokenId), amount]
        });

        console.log('📤 Sending fund transaction...');
        
        // Use retry mechanism for the fund transaction
        const result = await retryWithBackoff(async () => {
            return await sendTransaction({
                transaction: fundTransaction,
                account
            });
        }, 3, 1500); // 3 retries with 1.5s base delay

        console.log('✅ Fund transaction sent successfully:', result.transactionHash);
        return result.transactionHash;
    } catch (error) {
        console.error('❌ Error funding scholarship:', error);
        
        // Enhanced error handling with specific error types
        if (error instanceof Error) {
            // Check for specific error patterns
            if (error.message.includes('0xfb8f41b2')) {
                throw new Error('Transaction failed - this usually means insufficient allowance or the approval transaction is still pending. Please wait a moment and try again.');
            } else if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient USDT balance to fund this scholarship.');
            } else if (error.message.includes('user rejected')) {
                throw new Error('Transaction was rejected by user.');
            } else if (error.message.includes('Scholarship does not exist')) {
                throw new Error('This scholarship does not exist.');
            } else if (error.message.includes('Amount must be greater than 0')) {
                throw new Error('Funding amount must be greater than 0.');
            } else {
                throw new Error(`Failed to fund scholarship: ${error.message}`);
            }
        } else {
            throw new Error('Failed to fund scholarship: Unknown error occurred');
        }
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
        console.log('GetScholarshipMetadata - Requesting tokenId:', tokenId);
        
        const uri = await readContract({
            contract: cirqaCore,
            method: "function tokenURI(uint256 tokenId) view returns (string)",
            params: [BigInt(tokenId)]
        });

        console.log('GetScholarshipMetadata - Raw response from contract:', uri);
        console.log('GetScholarshipMetadata - Response type:', typeof uri);
        console.log('GetScholarshipMetadata - Response length:', uri?.length);

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
 * Get complete scholarship data (student, balance, metadata, frozen status)
 */
export async function getScholarshipData(tokenId: number): Promise<ScholarshipData> {
    try {
        const [student, balance, metadata, frozen] = await readContract({
            contract: scholarshipManagerContract,
            method: "function getScholarshipData(uint256 tokenId) view returns (address, uint256, string, bool)",
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
            totalWithdrawn,
            frozen: frozen as boolean
        };
    } catch (error) {
        console.error('Error getting scholarship data:', error);
        throw new Error(`Failed to get scholarship data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// ===== NEW INVESTOR TRACKING FUNCTIONS =====

/**
 * Get all investors who have funded a scholarship
 */
export async function getScholarshipInvestors(tokenId: number): Promise<string[]> {
    try {
        const investors = await readContract({
            contract: scholarshipManagerContract,
            method: "function getInvestors(uint256 tokenId) view returns (address[])",
            params: [BigInt(tokenId)]
        });

        return investors as string[];
    } catch (error) {
        console.error('Error getting scholarship investors:', error);
        throw new Error(`Failed to get investors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get the contribution amount of a specific investor for a scholarship
 */
export async function getInvestorContribution(tokenId: number, investorAddress: string): Promise<bigint> {
    try {
        const contribution = await readContract({
            contract: scholarshipManagerContract,
            method: "function getInvestorContribution(uint256 tokenId, address investor) view returns (uint256)",
            params: [BigInt(tokenId), investorAddress]
        });

        return contribution;
    } catch (error) {
        console.error('Error getting investor contribution:', error);
        throw new Error(`Failed to get investor contribution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get total funding received by a scholarship
 */
export async function getTotalScholarshipFunding(tokenId: number): Promise<bigint> {
    try {
        const totalFunding = await readContract({
            contract: scholarshipManagerContract,
            method: "function getTotalFunding(uint256 tokenId) view returns (uint256)",
            params: [BigInt(tokenId)]
        });

        return totalFunding;
    } catch (error) {
        console.error('Error getting total scholarship funding:', error);
        throw new Error(`Failed to get total funding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get the number of investors for a scholarship
 */
export async function getInvestorCount(tokenId: number): Promise<number> {
    try {
        const count = await readContract({
            contract: scholarshipManagerContract,
            method: "function getInvestorCount(uint256 tokenId) view returns (uint256)",
            params: [BigInt(tokenId)]
        });

        return Number(count);
    } catch (error) {
        console.error('Error getting investor count:', error);
        throw new Error(`Failed to get investor count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get comprehensive funding information for a scholarship
 */
export async function getScholarshipFundingInfo(tokenId: number): Promise<ScholarshipFunding> {
    try {
        const [investors, totalFunding, investorCount] = await Promise.all([
            getScholarshipInvestors(tokenId),
            getTotalScholarshipFunding(tokenId),
            getInvestorCount(tokenId)
        ]);

        return {
            totalFunding,
            investorCount,
            investors
        };
    } catch (error) {
        console.error('Error getting scholarship funding info:', error);
        throw new Error(`Failed to get funding info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get detailed investor information with contributions
 */
export async function getDetailedInvestorInfo(tokenId: number): Promise<InvestorInfo[]> {
    try {
        const investors = await getScholarshipInvestors(tokenId);
        
        const investorDetails = await Promise.all(
            investors.map(async (address) => {
                const contribution = await getInvestorContribution(tokenId, address);
                return { address, contribution };
            })
        );

        return investorDetails;
    } catch (error) {
        console.error('Error getting detailed investor info:', error);
        throw new Error(`Failed to get detailed investor info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// ===== NEW FREEZE MANAGEMENT FUNCTIONS =====

/**
 * Check if a scholarship is frozen
 */
export async function isScholarshipFrozen(tokenId: number): Promise<boolean> {
    try {
        const frozen = await readContract({
            contract: scholarshipManagerContract,
            method: "function isFrozen(uint256 tokenId) view returns (bool)",
            params: [BigInt(tokenId)]
        });

        return frozen;
    } catch (error) {
        console.error('Error checking if scholarship is frozen:', error);
        throw new Error(`Failed to check freeze status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Check if a scholarship should be frozen based on its score
 */
export async function shouldScholarshipBeFrozen(tokenId: number): Promise<boolean> {
    try {
        const shouldBeFrozen = await readContract({
            contract: scholarshipManagerContract,
            method: "function shouldBeFrozen(uint256 tokenId) view returns (bool)",
            params: [BigInt(tokenId)]
        });

        return shouldBeFrozen;
    } catch (error) {
        console.error('Error checking if scholarship should be frozen:', error);
        throw new Error(`Failed to check should be frozen: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// ===== NEW ENHANCED WITHDRAWAL HISTORY FUNCTIONS =====

/**
 * Get detailed withdrawal history with fee information
 */
export async function getDetailedWithdrawalHistory(tokenId: number): Promise<DetailedWithdrawalHistory> {
    try {
        const [netAmounts, timestamps, feeAmounts] = await readContract({
            contract: scholarshipManagerContract,
            method: "function getDetailedWithdrawalHistory(uint256 tokenId) view returns (uint256[], uint256[], uint256[])",
            params: [BigInt(tokenId)]
        });

        return {
            netAmounts: netAmounts as bigint[],
            timestamps: timestamps as bigint[],
            feeAmounts: feeAmounts as bigint[]
        };
    } catch (error) {
        console.error('Error getting detailed withdrawal history:', error);
        throw new Error(`Failed to get detailed withdrawal history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get withdrawal fee for a specific withdrawal
 */
export async function getWithdrawalFee(tokenId: number, withdrawalIndex: number): Promise<bigint> {
    try {
        const fee = await readContract({
            contract: scholarshipManagerContract,
            method: "function getWithdrawalFee(uint256 tokenId, uint256 index) view returns (uint256)",
            params: [BigInt(tokenId), BigInt(withdrawalIndex)]
        });

        return fee;
    } catch (error) {
        console.error('Error getting withdrawal fee:', error);
        throw new Error(`Failed to get withdrawal fee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get comprehensive withdrawal statistics
 */
export async function getWithdrawalStats(tokenId: number): Promise<{
    totalWithdrawals: number;
    totalNetAmount: bigint;
    totalFees: bigint;
    averageFeeRate: number; // As percentage
}> {
    try {
        const detailedHistory = await getDetailedWithdrawalHistory(tokenId);
        
        const totalWithdrawals = detailedHistory.netAmounts.length;
        const totalNetAmount = detailedHistory.netAmounts.reduce((sum, amount) => sum + amount, BigInt(0));
        const totalFees = detailedHistory.feeAmounts.reduce((sum, fee) => sum + fee, BigInt(0));
        
        // Calculate average fee rate as percentage
        const totalGrossAmount = totalNetAmount + totalFees;
        const averageFeeRate = totalGrossAmount > 0 
            ? Number(totalFees * BigInt(10000) / totalGrossAmount) / 100 // Convert to percentage with 2 decimal places
            : 0;

        return {
            totalWithdrawals,
            totalNetAmount,
            totalFees,
            averageFeeRate
        };
    } catch (error) {
        console.error('Error getting withdrawal stats:', error);
        return {
            totalWithdrawals: 0,
            totalNetAmount: BigInt(0),
            totalFees: BigInt(0),
            averageFeeRate: 0
        };
    }
}

// ===== SCHOLARSHIP DELETION FUNCTIONS =====

/**
 * Check if a scholarship can be deleted
 */
export async function canDeleteScholarship(tokenId: number): Promise<boolean> {
    try {
        const canDelete = await readContract({
            contract: scholarshipManagerContract,
            method: "function canDeleteScholarship(uint256 tokenId) view returns (bool)",
            params: [BigInt(tokenId)]
        });

        return canDelete;
    } catch (error) {
        console.error('Error checking if scholarship can be deleted:', error);
        throw new Error(`Failed to check delete eligibility: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Delete a scholarship (only owner can delete)
 */
export async function deleteScholarship(params: {
    tokenId: number;
    account: any;
}): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
}> {
    const { tokenId, account } = params;

    try {
        if (!account) {
            throw new Error('No account connected');
        }

        // First check if scholarship can be deleted
        const canDelete = await canDeleteScholarship(tokenId);
        if (!canDelete) {
            throw new Error('Cannot delete scholarship: it has funding, ratings, or withdrawals');
        }

        // Prepare the delete transaction
        const transaction = prepareContractCall({
            contract: cirqaCore,
            method: "function deleteScholarship(uint256 tokenId)",
            params: [BigInt(tokenId)]
        });

        // Send the transaction
        const { transactionHash } = await sendTransaction({
            transaction,
            account
        });

        // Wait for confirmation
        const receipt = await waitForReceipt({
            client,
            chain,
            transactionHash
        });

        if (receipt.status === 'success') {
            console.log(`✅ Scholarship ${tokenId} deleted successfully`);
            return {
                success: true,
                transactionHash
            };
        } else {
            throw new Error('Transaction failed');
        }

    } catch (error: any) {
        console.error('Error deleting scholarship:', error);
        
        let errorMessage = 'Unknown error occurred';
        if (error?.message) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        return {
            success: false,
            error: errorMessage
        };
    }
}