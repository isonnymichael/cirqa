import { prepareContractCall, sendTransaction, readContract, getContract, waitForReceipt } from 'thirdweb';
import { Account } from 'thirdweb/wallets';
import { MaxUint256 } from 'ethers';
import { cirqaCore, scoreManagerContract, cirqaTokenContract, client, chain } from '@/lib/contracts';

// Types for score operations
export interface UpdateScoreParams {
    tokenId: number;
    score: bigint;
    account: Account;
}

export interface RateScholarshipParams {
    tokenId: number;
    score: number; // 1-10 scale
    amount: bigint; // Amount of Cirqa tokens to use for rating
    account: Account;
}

export interface InvestorRating {
    score: number;
    tokens: bigint;
    timestamp: bigint;
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
 * Get scholarship score
 */
export async function getScholarshipScore(tokenId: number): Promise<bigint> {
    try {
        const scoreManager = scoreManagerContract;

        const score = await readContract({
            contract: scoreManager,
            method: "function getScholarshipScore(uint256 tokenId) view returns (uint256)",
            params: [BigInt(tokenId)]
        });

        return score;
    } catch (error) {
        console.error('Error getting scholarship score:', error);
        throw new Error(`Failed to get scholarship score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Update scholarship score (admin only)
 */
export async function updateScholarshipScore(params: UpdateScoreParams): Promise<string> {
    try {
        const { tokenId, score, account } = params;

        const scoreManager = scoreManagerContract;

        const transaction = prepareContractCall({
            contract: scoreManager,
            method: "function updateScore(uint256 tokenId, uint256 score) external",
            params: [BigInt(tokenId), score]
        });

        const result = await sendTransaction({
            transaction,
            account
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error updating scholarship score:', error);
        throw new Error(`Failed to update scholarship score: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get multiple scholarship scores
 */
export async function getMultipleScholarshipScores(tokenIds: number[]): Promise<{ tokenId: number; score: bigint }[]> {
    try {
        const scores = await Promise.all(
            tokenIds.map(async (tokenId) => {
                const score = await getScholarshipScore(tokenId);
                return { tokenId, score };
            })
        );

        return scores;
    } catch (error) {
        console.error('Error getting multiple scholarship scores:', error);
        throw new Error(`Failed to get multiple scholarship scores: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Rate a scholarship using Cirqa tokens
 */
export async function rateScholarship(params: RateScholarshipParams): Promise<string> {
    try {
        const { tokenId, score, amount, account } = params;

        console.log('🎯 Starting scholarship rating process...');
        console.log('   Account:', account.address);
        console.log('   Token ID:', tokenId);
        console.log('   Score:', score);
        console.log('   Amount:', amount.toString());

        // Validate score range
        if (score < 1 || score > 10) {
            throw new Error('Score must be between 1 and 10');
        }

        // First, check if we need to approve Cirqa token spending
        console.log('🔍 Checking current CIRQA allowance for ScoreManager...');
        const currentAllowance = await readContract({
            contract: cirqaTokenContract,
            method: "function allowance(address owner, address spender) view returns (uint256)",
            params: [account.address, scoreManagerContract.address]
        });

        console.log('📊 Current allowance:', currentAllowance.toString());
        console.log('📊 Required amount:', amount.toString());

        // If allowance is insufficient, approve unlimited amount
        if (currentAllowance < amount) {
            console.log('🔄 Current allowance insufficient, requesting unlimited approval...');
            
            const approveTransaction = prepareContractCall({
                contract: cirqaTokenContract,
                method: "function approve(address spender, uint256 amount) returns (bool)",
                params: [scoreManagerContract.address, MaxUint256]
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
            
            // Double-check the allowance is actually updated with retry mechanism
            console.log('🔄 Verifying CIRQA allowance update...');
            const updatedAllowance = await retryWithBackoff(async () => {
                const allowance = await readContract({
                    contract: cirqaTokenContract,
                    method: "function allowance(address owner, address spender) view returns (uint256)",
                    params: [account.address, scoreManagerContract.address]
                });
                
                if (allowance < amount) {
                    throw new Error(`CIRQA allowance still insufficient: ${allowance.toString()} < ${amount.toString()}`);
                }
                
                return allowance;
            }, 5, 1000); // 5 retries with 1s base delay
            
            console.log('✅ CIRQA allowance verified:', updatedAllowance.toString());
        }

        // Final allowance check before rating
        console.log('🔍 Final allowance verification before rating...');
        const finalAllowance = await readContract({
            contract: cirqaTokenContract,
            method: "function allowance(address owner, address spender) view returns (uint256)",
            params: [account.address, scoreManagerContract.address]
        });
        
        if (finalAllowance < amount) {
            throw new Error(`Final allowance check failed: ${finalAllowance.toString()} < ${amount.toString()}`);
        }
        
        console.log('✅ Final allowance check passed:', finalAllowance.toString());

        // Now rate the scholarship
        console.log('🎯 Preparing rating transaction...');
        const rateTransaction = prepareContractCall({
            contract: scoreManagerContract,
            method: "function rateScholarship(uint256 tokenId, uint8 score, uint256 amount) external",
            params: [BigInt(tokenId), score, amount]
        });

        console.log('📤 Sending rating transaction...');
        
        // Use retry mechanism for the rating transaction
        const result = await retryWithBackoff(async () => {
            return await sendTransaction({
                transaction: rateTransaction,
                account
            });
        }, 3, 1500); // 3 retries with 1.5s base delay

        console.log('✅ Rating transaction sent successfully:', result.transactionHash);
        return result.transactionHash;
    } catch (error) {
        console.error('❌ Error rating scholarship:', error);
        
        // Enhanced error handling with specific error types
        if (error instanceof Error) {
            // Check for specific error patterns
            if (error.message.includes('0xfb8f41b2')) {
                throw new Error('Rating failed - this usually means insufficient CIRQA allowance or the approval transaction is still pending. Please wait a moment and try again.');
            } else if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient CIRQA balance to rate this scholarship.');
            } else if (error.message.includes('user rejected')) {
                throw new Error('Transaction was rejected by user.');
            } else if (error.message.includes('Score must be between 1 and 10')) {
                throw new Error('Score must be between 1 and 10.');
            } else if (error.message.includes('Scholarship does not exist')) {
                throw new Error('This scholarship does not exist.');
            } else {
                throw new Error(`Failed to rate scholarship: ${error.message}`);
            }
        } else {
            throw new Error('Failed to rate scholarship: Unknown error occurred');
        }
    }
}

/**
 * Get investor's rating for a scholarship
 */
export async function getInvestorRating(tokenId: number, investorAddress: string): Promise<InvestorRating | null> {
    try {
        const rating = await readContract({
            contract: scoreManagerContract,
            method: "function getInvestorRating(uint256 tokenId, address investor) view returns (uint8 score, uint256 tokens, uint256 timestamp)",
            params: [BigInt(tokenId), investorAddress]
        });

        // If no rating exists, tokens will be 0
        if (rating[1] === BigInt(0)) {
            return null;
        }

        return {
            score: Number(rating[0]),
            tokens: rating[1],
            timestamp: rating[2]
        };
    } catch (error) {
        console.error('Error getting investor rating:', error);
        return null; // Return null if rating doesn't exist or error occurs
    }
}

/**
 * Get minimum Cirqa tokens required for rating
 */
export async function getMinRatingTokens(): Promise<bigint> {
    try {
        const minTokens = await readContract({
            contract: scoreManagerContract,
            method: "function minRatingTokens() view returns (uint256)",
            params: []
        });

        return minTokens;
    } catch (error) {
        console.error('Error getting min rating tokens:', error);
        throw new Error(`Failed to get min rating tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get scholarship rating statistics
 */
export async function getScholarshipRatingStats(tokenId: number): Promise<{
    averageScore: number;
    totalRatings: number;
    totalTokensUsed: bigint;
}> {
    try {
        // Get data using separate contract calls
        const [score, totalTokens, ratingCount] = await Promise.all([
            readContract({
                contract: scoreManagerContract,
                method: "function getScholarshipScore(uint256 tokenId) view returns (uint256)",
                params: [BigInt(tokenId)]
            }),
            readContract({
                contract: scoreManagerContract,
                method: "function getTotalRatingTokens(uint256 tokenId) view returns (uint256)",
                params: [BigInt(tokenId)]
            }),
            readContract({
                contract: scoreManagerContract,
                method: "function getRatingCount(uint256 tokenId) view returns (uint256)",
                params: [BigInt(tokenId)]
            })
        ]);

        // Score is already calculated as weighted average (with 2 decimal places)
        const averageScore = Number(score) / 100; // Contract returns score * 100

        return {
            averageScore: Math.round(averageScore * 100) / 100, // Round to 2 decimal places
            totalRatings: Number(ratingCount),
            totalTokensUsed: totalTokens
        };
    } catch (error) {
        console.error('Error getting scholarship rating stats:', error);
        return {
            averageScore: 0,
            totalRatings: 0,
            totalTokensUsed: BigInt(0)
        };
    }
}