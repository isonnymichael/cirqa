'use client';

import React, { useState } from 'react';

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

type ScholarshipMetadataFormProps = {
  onMetadataGenerated: (metadata: ScholarshipMetadata, jsonString: string) => void;
  className?: string;
};

const ScholarshipMetadataForm: React.FC<ScholarshipMetadataFormProps> = ({ 
  onMetadataGenerated,
  className = '' 
}) => {
  const [metadata, setMetadata] = useState<ScholarshipMetadata>({
    name: '',
    description: '',
    image: '',
    attributes: [
      { trait_type: 'Field of Study', value: '' },
      { trait_type: 'Degree', value: '' },
      { trait_type: 'Year', value: '' },
      { trait_type: 'University', value: '' }
    ],
    contact: {
      email: '',
      twitter: ''
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAttributeChange = (index: number, value: string) => {
    const newAttributes = [...metadata.attributes];
    newAttributes[index] = { ...newAttributes[index], value };
    
    setMetadata(prev => ({
      ...prev,
      attributes: newAttributes
    }));
  };

  const handleContactChange = (field: 'email' | 'twitter', value: string) => {
    setMetadata(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value
      }
    }));
  };

  const generateMetadata = () => {
    // Filter out empty attributes
    const filteredAttributes = metadata.attributes.filter(attr => attr.value.trim() !== '');
    
    const finalMetadata = {
      ...metadata,
      attributes: filteredAttributes
    };
    
    const jsonString = JSON.stringify(finalMetadata, null, 2);
    onMetadataGenerated(finalMetadata, jsonString);
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Scholarship Name</label>
          <input
            type="text"
            value={metadata.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., John Doe's Computer Science Scholarship"
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={metadata.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your educational background, goals, and why you need funding"
            rows={4}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Image URL (IPFS preferred)</label>
          <input
            type="text"
            value={metadata.image}
            onChange={(e) => handleInputChange('image', e.target.value)}
            placeholder="ipfs://QmYourImageHash or https://..."
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Attributes</h4>
          <div className="space-y-3">
            {metadata.attributes.map((attr, index) => (
              <div key={index} className="flex items-center">
                <span className="w-1/3 text-sm text-gray-400">{attr.trait_type}</span>
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => handleAttributeChange(index, e.target.value)}
                  placeholder={`Enter ${attr.trait_type.toLowerCase()}`}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Contact Information</h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="w-1/3 text-sm text-gray-400">Email</span>
              <input
                type="email"
                value={metadata.contact.email}
                onChange={(e) => handleContactChange('email', e.target.value)}
                placeholder="your.email@example.com"
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center">
              <span className="w-1/3 text-sm text-gray-400">Twitter</span>
              <input
                type="text"
                value={metadata.contact.twitter}
                onChange={(e) => handleContactChange('twitter', e.target.value)}
                placeholder="@username"
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <button
          onClick={generateMetadata}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Generate Metadata JSON
        </button>
      </div>
    </div>
  );
};

export default ScholarshipMetadataForm;