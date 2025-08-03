'use client';

import React from 'react';
import ScholarshipMetadataForm from '@/components/app/ScholarshipMetadataForm';
import Link from 'next/link';

const MetadataGeneratorPage: React.FC = () => {
  const handleMetadataGenerated = (metadata: any, json: string) => {
    // Optional: Add analytics or other actions when metadata is generated
    console.log('Metadata generated:', metadata);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link 
          href="/app" 
          className="mr-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold">Create New Scholarship</h1>
      </div>

      <ScholarshipMetadataForm onMetadataGenerated={handleMetadataGenerated} />
    </div>
  );
};

export default MetadataGeneratorPage;