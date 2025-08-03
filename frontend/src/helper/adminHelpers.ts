import { prepareContractCall, sendTransaction, readContract } from 'thirdweb';
import { Account } from 'thirdweb/wallets';
import { cirqaCore } from '@/lib/contracts';

// Types for admin operations
export interface UpdateProtocolParams {
    account: Account;
}

export interface UpdateRewardRateParams extends UpdateProtocolParams {
    newRate: bigint;
}

export interface UpdateProtocolFeeParams extends UpdateProtocolParams {
    newFee: bigint;
}

export interface UpdateUSDTContractParams extends UpdateProtocolParams {
    newUsdtContract: string;
}

export interface SetScholarshipManagerParams extends UpdateProtocolParams {
    scholarshipManager: string;
}

export interface SetScoreManagerParams extends UpdateProtocolParams {
    scoreManager: string;
}

/**
 * Update the reward rate for investors (only owner)
 */
export async function updateRewardRate(params: UpdateRewardRateParams): Promise<string> {
    try {
        const { newRate, account } = params;

        const transaction = prepareContractCall({
            contract: cirqaCore,
            method: "function updateRewardRate(uint256 newRate) external",
            params: [newRate]
        });

        const result = await sendTransaction({
            transaction,
            account
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error updating reward rate:', error);
        throw new Error(`Failed to update reward rate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Update the protocol fee for withdrawals (only owner)
 */
export async function updateProtocolFee(params: UpdateProtocolFeeParams): Promise<string> {
    try {
        const { newFee, account } = params;

        // Validate fee is not more than 10% (1000 basis points)
        if (newFee > BigInt(1000)) {
            throw new Error('Protocol fee cannot exceed 10%');
        }

        const transaction = prepareContractCall({
            contract: cirqaCore,
            method: "function setProtocolFee(uint256 newFee) external",
            params: [newFee]
        });

        const result = await sendTransaction({
            transaction,
            account
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error updating protocol fee:', error);
        throw new Error(`Failed to update protocol fee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Update the USDT contract address (only owner)
 */
export async function updateUSDTContract(params: UpdateUSDTContractParams): Promise<string> {
    try {
        const { newUsdtContract, account } = params;

        const transaction = prepareContractCall({
            contract: cirqaCore,
            method: "function updateUSDTContract(address newUsdtContract) external",
            params: [newUsdtContract]
        });

        const result = await sendTransaction({
            transaction,
            account
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error updating USDT contract:', error);
        throw new Error(`Failed to update USDT contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Set the scholarship manager contract (only owner)
 */
export async function setScholarshipManager(params: SetScholarshipManagerParams): Promise<string> {
    try {
        const { scholarshipManager, account } = params;

        const transaction = prepareContractCall({
            contract: cirqaCore,
            method: "function setScholarshipManager(address _scholarshipManager) external",
            params: [scholarshipManager]
        });

        const result = await sendTransaction({
            transaction,
            account
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error setting scholarship manager:', error);
        throw new Error(`Failed to set scholarship manager: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Set the score manager contract (only owner)
 */
export async function setScoreManager(params: SetScoreManagerParams): Promise<string> {
    try {
        const { scoreManager, account } = params;

        const transaction = prepareContractCall({
            contract: cirqaCore,
            method: "function setScoreManager(address _scoreManager) external",
            params: [scoreManager]
        });

        const result = await sendTransaction({
            transaction,
            account
        });

        return result.transactionHash;
    } catch (error) {
        console.error('Error setting score manager:', error);
        throw new Error(`Failed to set score manager: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get current reward rate
 */
export async function getRewardRate(): Promise<bigint> {
    try {
        const rewardRate = await readContract({
            contract: cirqaCore,
            method: "function rewardRate() view returns (uint256)",
            params: []
        });

        return rewardRate;
    } catch (error) {
        console.error('Error getting reward rate:', error);
        throw new Error(`Failed to get reward rate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get current protocol fee
 */
export async function getProtocolFee(): Promise<bigint> {
    try {
        const protocolFee = await readContract({
            contract: cirqaCore,
            method: "function protocolFee() view returns (uint256)",
            params: []
        });

        return protocolFee;
    } catch (error) {
        console.error('Error getting protocol fee:', error);
        throw new Error(`Failed to get protocol fee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get current USDT contract address
 */
export async function getUSDTContractAddress(): Promise<string> {
    try {
        const usdtAddress = await readContract({
            contract: cirqaCore,
            method: "function usdtToken() view returns (address)",
            params: []
        });

        return usdtAddress;
    } catch (error) {
        console.error('Error getting USDT contract address:', error);
        throw new Error(`Failed to get USDT contract address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get current Cirqa token contract address
 */
export async function getCirqaTokenAddress(): Promise<string> {
    try {
        const cirqaAddress = await readContract({
            contract: cirqaCore,
            method: "function cirqaToken() view returns (address)",
            params: []
        });

        return cirqaAddress;
    } catch (error) {
        console.error('Error getting Cirqa token address:', error);
        throw new Error(`Failed to get Cirqa token address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get current scholarship manager address
 */
export async function getScholarshipManagerAddress(): Promise<string> {
    try {
        const scholarshipManagerAddress = await readContract({
            contract: cirqaCore,
            method: "function scholarshipManager() view returns (address)",
            params: []
        });

        return scholarshipManagerAddress;
    } catch (error) {
        console.error('Error getting scholarship manager address:', error);
        throw new Error(`Failed to get scholarship manager address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get current score manager address
 */
export async function getScoreManagerAddress(): Promise<string> {
    try {
        const scoreManagerAddress = await readContract({
            contract: cirqaCore,
            method: "function scoreManager() view returns (address)",
            params: []
        });

        return scoreManagerAddress;
    } catch (error) {
        console.error('Error getting score manager address:', error);
        throw new Error(`Failed to get score manager address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Get contract owner address
 */
export async function getOwner(): Promise<string> {
    try {
        const owner = await readContract({
            contract: cirqaCore,
            method: "function owner() view returns (address)",
            params: []
        });

        return owner;
    } catch (error) {
        console.error('Error getting owner:', error);
        throw new Error(`Failed to get owner: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Check if an address is the contract owner
 */
export async function isOwner(address: string): Promise<boolean> {
    try {
        const owner = await getOwner();
        return owner.toLowerCase() === address.toLowerCase();
    } catch (error) {
        console.error('Error checking owner status:', error);
        return false;
    }
}

/**
 * Get all protocol configuration
 */
export async function getProtocolConfig(): Promise<{
    rewardRate: bigint;
    protocolFee: bigint;
    owner: string;
    usdtContract: string;
    cirqaToken: string;
    scholarshipManager: string;
    scoreManager: string;
}> {
    try {
        const [
            rewardRate,
            protocolFee,
            owner,
            usdtContract,
            cirqaToken,
            scholarshipManager,
            scoreManager
        ] = await Promise.all([
            getRewardRate(),
            getProtocolFee(),
            getOwner(),
            getUSDTContractAddress(),
            getCirqaTokenAddress(),
            getScholarshipManagerAddress(),
            getScoreManagerAddress()
        ]);

        return {
            rewardRate,
            protocolFee,
            owner,
            usdtContract,
            cirqaToken,
            scholarshipManager,
            scoreManager
        };
    } catch (error) {
        console.error('Error getting protocol config:', error);
        throw new Error(`Failed to get protocol config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}