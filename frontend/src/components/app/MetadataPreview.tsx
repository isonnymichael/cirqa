'use client';

import React, { useState } from 'react';

type MetadataPreviewProps = {
  jsonString: string;
  onCopy: () => void;
  className?: string;
};

const MetadataPreview: React.FC<MetadataPreviewProps> = ({ 
  jsonString, 
  onCopy,
  className = '' 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy();
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 md:p-6 border border-gray-700 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 md:mb-4">
        <h3 className="text-base md:text-lg font-semibold">Metadata Preview</h3>
        <button
          onClick={handleCopy}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-xs md:text-sm flex items-center justify-center transition-colors w-full sm:w-auto"
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy JSON
            </>
          )}
        </button>
      </div>
      
      <div className="bg-gray-900 rounded-md p-3 md:p-4 overflow-x-auto max-h-[200px] md:max-h-[300px] overflow-y-auto">
        <pre className="text-xs text-gray-300 whitespace-pre-wrap break-words">
          {jsonString}
        </pre>
      </div>
      
      <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-400">
        <p className="font-medium mb-2">Next steps:</p>
        <ol className="list-decimal list-inside space-y-1 pl-2">
          <li>Copy this JSON</li>
          <li>Upload it to IPFS using services like <a href="https://pinata.cloud" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-words">Pinata</a> or <a href="https://nft.storage" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-words">NFT.Storage</a></li>
          <li>Use the resulting IPFS hash (CID) when creating your scholarship</li>
        </ol>
      </div>
    </div>
  );
};

export default MetadataPreview;