import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { kiiTestnet } from './chain';

const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

import CirqaProtocolABI from '@/abi/CirqaProtocol.json';
import CirqaTokenABI from '@/abi/CirqaToken.json';

export const CIRQA_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_CIRQA_TOKEN_ADDRESS!;
export const CIRQA_PROTOCOL_ADDRESS = process.env.NEXT_PUBLIC_CIRQA_PROTOCOL_ADDRESS!;

export const cirqaTokenContract = getContract({
    client,
    chain: kiiTestnet,
    address: CIRQA_TOKEN_ADDRESS,
});

export const cirqaProtocolContract = getContract({
    client,
    chain: kiiTestnet,
    address: CIRQA_PROTOCOL_ADDRESS,
});