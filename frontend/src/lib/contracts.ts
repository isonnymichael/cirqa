import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { kiiTestnet } from './chain';

export const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export const chain = kiiTestnet;

export const CIRQA_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CIRQA_TOKEN_ADDRESS!;
export const USDT_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_USDT_TOKEN_ADDRESS!;

export const CIRQA_CORE = process.env.NEXT_PUBLIC_CIRQA_CORE!;
export const SCHOLARSHIP_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CIRQA_SCHOLARSHIP_MANAGER!;
export const SCORE_MANAGER_ADDRESS = process.env.NEXT_PUBLIC_CIRQA_SCORE_MANAGER!;

export const cirqaTokenContract = getContract({
    client,
    chain: kiiTestnet,
    address: CIRQA_TOKEN_ADDRESS,
});

export const usdtTokenContract = getContract({
    client,
    chain: kiiTestnet,
    address: USDT_TOKEN_ADDRESS,
});

export const cirqaCore = getContract({
    client,
    chain: kiiTestnet,
    address: CIRQA_CORE,
});

export const scholarshipManagerContract = getContract({
    client,
    chain: kiiTestnet,
    address: SCHOLARSHIP_MANAGER_ADDRESS,
});

export const scoreManagerContract = getContract({
    client,
    chain: kiiTestnet,
    address: SCORE_MANAGER_ADDRESS,
});

