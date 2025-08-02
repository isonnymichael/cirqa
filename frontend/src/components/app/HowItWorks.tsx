'use client';

import React from 'react';

type HowItWorksProps = {
  className?: string;
};

const HowItWorks: React.FC<HowItWorksProps> = ({ className = '' }) => {
  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">How It Works</h3>
      
      <div className="space-y-6">
        <div>
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-2">
              <span className="text-xs font-bold">1</span>
            </div>
            <h4 className="font-medium">Create a Scholarship</h4>
          </div>
          <p className="text-sm text-gray-400 ml-8">
            Students can create a scholarship by providing an IPFS metadata hash containing their information.
          </p>
        </div>
        
        <div>
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-2">
              <span className="text-xs font-bold">2</span>
            </div>
            <h4 className="font-medium">Fund a Scholarship</h4>
          </div>
          <p className="text-sm text-gray-400 ml-8">
            Investors can fund scholarships with USDT and receive CIRQA tokens as rewards.
          </p>
        </div>
        
        <div>
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mr-2">
              <span className="text-xs font-bold">3</span>
            </div>
            <h4 className="font-medium">Withdraw Funds</h4>
          </div>
          <p className="text-sm text-gray-400 ml-8">
            Students can withdraw USDT from their scholarship when needed.
          </p>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-700">
        <h4 className="font-medium mb-2">Reward System</h4>
        <p className="text-sm text-gray-400">
          For every USDT invested in a scholarship, investors receive CIRQA tokens based on the current reward rate.
          These tokens can be used for governance and other benefits within the Cirqa ecosystem.
        </p>
      </div>
    </div>
  );
};

export default HowItWorks;