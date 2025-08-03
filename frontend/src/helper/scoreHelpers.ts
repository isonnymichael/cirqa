import { prepareContractCall, sendTransaction, readContract, getContract } from 'thirdweb';
import { Account } from 'thirdweb/wallets';
import { MaxUint256 } from 'ethers';
import { cirqaCore, scoreManagerContract, cirqaTokenContract } from '@/lib/contracts';

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

        // Validate score range
        if (score < 1 || score > 10) {
            throw new Error('Score must be between 1 and 10');
        }

        // First, check if we need to approve Cirqa token spending
        const currentAllowance = await readContract({
            contract: cirqaTokenContract,
            method: "function allowance(address owner, address spender) view returns (uint256)",
            params: [account.address, scoreManagerContract.address]
        });

        // If allowance is insufficient, approve unlimited amount
        if (currentAllowance < amount) {
            const approveTransaction = prepareContractCall({
                contract: cirqaTokenContract,
                method: "function approve(address spender, uint256 amount) returns (bool)",
                params: [scoreManagerContract.address, MaxUint256]
            });

            await sendTransaction({
                transaction: approveTransaction,
                account
            });
            
            console.log('✅ Cirqa token unlimited approval granted for ScoreManager contract');
        }

        // Now rate the scholarship
        const rateTransaction = prepareContractCall({
            contract: scoreManagerContract,
            method: "function rateScholarship(uint256 tokenId, uint8 score, uint256 amount) external",
            params: [BigInt(tokenId), score, amount]
        });

        const result = await sendTransaction({
            transaction: rateTransaction,
            account
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error rating scholarship:', error);
        throw new Error(`Failed to rate scholarship: ${error instanceof Error ? error.message : 'Unknown error'}`);
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