import { getContract } from 'thirdweb';
import { createThirdwebClient } from 'thirdweb';
import { kiiTestnet } from './chain';
import { Abi } from 'viem';

const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

export const CIRQA_TOKEN_ADDRESS = '0x5123eDad79f0845c2f622d99c625Ff000F117C3D';
export const CIRQA_PROTOCOL_ADDRESS = '0x69DfFdbCF18274A82f0a17793eEeCcb27B9b7398';

import CirqaToken from '../abi/CirqaToken.json';
import CirqaProtocol from '../abi/CirqaProtocol.json';

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