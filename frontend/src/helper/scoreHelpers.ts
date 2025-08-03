import { prepareContractCall, sendTransaction, readContract, getContract } from 'thirdweb';
import { Account } from 'thirdweb/wallets';
import { cirqaCore, scoreManagerContract } from '@/lib/contracts';

// Types for score operations
export interface UpdateScoreParams {
    tokenId: number;
    score: bigint;
    account: Account;
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