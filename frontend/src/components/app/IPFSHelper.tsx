'use client';

import React, { useState } from 'react';

type IPFSHelperProps = {
  className?: string;
};

const IPFSHelper: React.FC<IPFSHelperProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const sampleMetadata = {
    name: "John Doe Scholarship",
    description: "Computer Science student seeking funding for tuition",
    image: "ipfs://QmSampleImageHash",
    attributes: [
      { trait_type: "Field of Study", value: "Computer Science" },
      { trait_type: "Degree", value: "Bachelor's" },
      { trait_type: "Year", value: "2" },
      { trait_type: "University", value: "Example University" }
    ],
    contact: {
      email: "john.doe@example.com",
      twitter: "@johndoe"
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">IPFS Metadata Guide</h3>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          When creating a scholarship, you need to provide an IPFS hash that points to a JSON metadata file with your information.
        </p>
        
        <div>
          <h4 className="font-medium mb-2">How to Create IPFS Metadata:</h4>
          <ol className="list-decimal list-inside text-sm text-gray-400 space-y-2 ml-2">
            <li>Create a JSON file with your scholarship information</li>
            <li>Upload it to IPFS using services like <a href="https://pinata.cloud" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Pinata</a> or <a href="https://nft.storage" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">NFT.Storage</a></li>
            <li>Copy the resulting IPFS hash (CID)</li>
            <li>Use this hash when creating your scholarship</li>
          </ol>
        </div>
        
        <div>
          <button 
            onClick={toggleExpand}
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
          >
            {isExpanded ? 'Hide' : 'Show'} Sample Metadata
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isExpanded && (
            <div className="mt-3 bg-gray-900 p-3 rounded-md overflow-x-auto">
              <pre className="text-xs text-gray-300">
                {JSON.stringify(sampleMetadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IPFSHelper;