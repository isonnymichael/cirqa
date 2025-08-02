'use client';

import React from 'react';
import { cirqaProtocolContract, cirqaTokenContract, CIRQA_PROTOCOL_ADDRESS, CIRQA_TOKEN_ADDRESS } from '@/lib/contracts';

type ContractInfoProps = {
  className?: string;
};

const ContractInfo: React.FC<ContractInfoProps> = ({ className = '' }) => {
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Contract Information</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-1">Cirqa Protocol Contract</h4>
          <div className="flex items-center">
            <p className="font-mono text-sm">{formatAddress(CIRQA_PROTOCOL_ADDRESS)}</p>
            <button 
              onClick={() => navigator.clipboard.writeText(CIRQA_PROTOCOL_ADDRESS)}
              className="ml-2 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-1">Cirqa Token Contract</h4>
          <div className="flex items-center">
            <p className="font-mono text-sm">{formatAddress(CIRQA_TOKEN_ADDRESS)}</p>
            <button 
              onClick={() => navigator.clipboard.writeText(CIRQA_TOKEN_ADDRESS)}
              className="ml-2 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-400">
          The Cirqa Protocol is a scholarship system where students can mint NFTs with their data and receive USDT funding from investors.
          Investors are rewarded with Cirqa tokens for their contributions.
        </p>
      </div>
    </div>
  );
};

export default ContractInfo;