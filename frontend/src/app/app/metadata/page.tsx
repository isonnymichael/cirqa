'use client';

import React, { useState } from 'react';
import ScholarshipMetadataForm from '@/components/app/ScholarshipMetadataForm';
import MetadataPreview from '@/components/app/MetadataPreview';
import IPFSHelper from '@/components/app/IPFSHelper';
import Link from 'next/link';

type ScholarshipMetadata = {
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string }>;
  contact: {
    email: string;
    twitter: string;
  };
};

const MetadataGeneratorPage: React.FC = () => {
  const [generatedMetadata, setGeneratedMetadata] = useState<ScholarshipMetadata | null>(null);
  const [jsonString, setJsonString] = useState<string>('');

  const handleMetadataGenerated = (metadata: ScholarshipMetadata, json: string) => {
    setGeneratedMetadata(metadata);
    setJsonString(json);
    // Scroll to preview
    setTimeout(() => {
      document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCopy = () => {
    // Optional: Add analytics or other actions when copying
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
        <h1 className="text-2xl font-bold">Scholarship Metadata Generator</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ScholarshipMetadataForm onMetadataGenerated={handleMetadataGenerated} />
          
          {generatedMetadata && (
            <div id="preview-section" className="mt-8">
              <MetadataPreview 
                jsonString={jsonString} 
                onCopy={handleCopy} 
              />
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <IPFSHelper />
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Why Metadata Matters</h3>
            <p className="text-sm text-gray-400">
              Your scholarship metadata helps investors understand who you are, what you're studying, 
              and why they should fund your education. Complete and accurate metadata increases your 
              chances of receiving funding.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="font-medium mb-2">Best Practices</h4>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                <li>Use a clear, descriptive name</li>
                <li>Write a detailed description of your educational goals</li>
                <li>Include a professional photo or relevant image</li>
                <li>Provide accurate contact information</li>
                <li>Fill out all relevant attributes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataGeneratorPage;