'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

type ScholarshipMetadata = {
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string }>;
  contact: {
    email: string;
    twitter: string;
  };
  documents: Array<{ name: string; url: string; type: string }>;
};

type ScholarshipMetadataFormProps = {
  onMetadataGenerated: (metadata: ScholarshipMetadata, jsonString: string) => void;
  onCreateScholarship?: (metadata: ScholarshipMetadata, jsonString: string) => void;
  className?: string;
};

const ScholarshipMetadataForm: React.FC<ScholarshipMetadataFormProps> = ({ 
  onMetadataGenerated,
  onCreateScholarship,
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
      { trait_type: 'University or School', value: '' }
    ],
    contact: {
      email: '',
      twitter: ''
    },
    documents: []
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

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

  const handleDocumentChange = (index: number, field: 'name' | 'url' | 'type', value: string) => {
    const newDocuments = [...metadata.documents];
    newDocuments[index] = { ...newDocuments[index], [field]: value };
    
    setMetadata(prev => ({
      ...prev,
      documents: newDocuments
    }));
  };

  const addDocument = () => {
    setMetadata(prev => ({
      ...prev,
      documents: [...prev.documents, { name: '', url: '', type: 'PDF' }]
    }));
  };

  const removeDocument = (index: number) => {
    setMetadata(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setMetadata(prev => ({
          ...prev,
          image: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setMetadata(prev => ({
      ...prev,
      image: ''
    }));
  };

  // Generate metadata and JSON in real-time
  const finalMetadata = useMemo(() => {
    const filteredAttributes = metadata.attributes.filter(attr => attr.value.trim() !== '');
    const filteredDocuments = metadata.documents.filter(doc => 
      doc.name.trim() !== '' && doc.url.trim() !== ''
    );
    
    return {
      ...metadata,
      attributes: filteredAttributes,
      documents: filteredDocuments
    };
  }, [metadata]);

  const jsonString = useMemo(() => {
    return JSON.stringify(finalMetadata, null, 2);
  }, [finalMetadata]);

  // Auto-trigger callback when metadata changes
  useEffect(() => {
    onMetadataGenerated(finalMetadata, jsonString);
  }, [finalMetadata, jsonString]); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC key handler for modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showConfirmModal) {
        handleCloseModal();
      }
    };

    if (showConfirmModal) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent background scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [showConfirmModal]);

  // Validation functions
  const validateRequiredFields = () => {
    const missingFields = [];
    
    if (!metadata.name.trim()) missingFields.push('Scholarship Name');
    if (!metadata.description.trim()) missingFields.push('Description');
    if (!metadata.image) missingFields.push('Student Photo');
    if (!metadata.contact.email.trim()) missingFields.push('Email Contact');
    
    // Check if at least 2 attributes are filled
    const filledAttributes = metadata.attributes.filter(attr => attr.value.trim() !== '');
    if (filledAttributes.length < 2) missingFields.push('At least 2 Academic Information fields');
    
    return missingFields;
  };

  const handleCreateClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmCreate = () => {
    if (termsAccepted && onCreateScholarship) {
      setShowConfirmModal(false);
      setTermsAccepted(false);
      onCreateScholarship(finalMetadata, jsonString);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setTermsAccepted(false);
  };

  return (
    <div className={`${className}`}>
      {/* Main Grid: Form (larger) + Preview (smaller) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form (2/3 width) */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4">Scholarship Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Scholarship Name</label>
              <input
                type="text"
                value={metadata.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., John Doe's Computer Science Scholarship, Jane's Art School Fund"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={metadata.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your educational background, school/university goals, and why you need funding"
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Student Photo</label>
              {!metadata.image ? (
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-400">Click to upload image</span>
                    <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</span>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={metadata.image}
                    alt="Preview"
                    className="w-full h-32 object-contain bg-gray-900 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="cursor-pointer absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
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
                      placeholder={attr.trait_type === 'University or School' ? 'e.g., Harvard University, Jakarta High School' : `Enter ${attr.trait_type.toLowerCase()}`}
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

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Supporting Documents</h4>
                <button
                  type="button"
                  onClick={addDocument}
                  className="cursor-pointer text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                >
                  + Add Document
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-3">Add links to transcripts, certificates, portfolio, or other supporting documents</p>
              
              {metadata.documents.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No documents added yet. Click "Add Document" to include supporting materials.
                </div>
              ) : (
                <div className="space-y-3">
                  {metadata.documents.map((doc, index) => (
                    <div key={index} className="bg-gray-700/50 rounded p-3 border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Document {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="cursor-pointer text-red-400 hover:text-red-300 text-xs"
                        >
                          ✕ Remove
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="w-1/4 text-sm text-gray-400">Name</span>
                          <input
                            type="text"
                            value={doc.name}
                            onChange={(e) => handleDocumentChange(index, 'name', e.target.value)}
                            placeholder="e.g., Academic Transcript, Portfolio"
                            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div className="flex items-center">
                          <span className="w-1/4 text-sm text-gray-400">Type</span>
                          <select
                            value={doc.type}
                            onChange={(e) => handleDocumentChange(index, 'type', e.target.value)}
                            className="w-1/4 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 mr-2"
                          >
                            <option value="PDF">PDF</option>
                            <option value="Image">Image</option>
                            <option value="Document">Document</option>
                            <option value="Link">Link</option>
                            <option value="Video">Video</option>
                            <option value="Other">Other</option>
                          </select>
                          <input
                            type="url"
                            value={doc.url}
                            onChange={(e) => handleDocumentChange(index, 'url', e.target.value)}
                            placeholder="https://..."
                            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview (1/3 width) */}
        <div className="lg:col-span-1 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-base font-semibold mb-3">Preview</h2>
          
          <div className="space-y-3">
            {/* Image Preview */}
            <div className="bg-gray-700/30 rounded-lg p-3 border-2 border-dashed border-gray-600">
              {metadata.image ? (
                <img
                  src={metadata.image}
                  alt="Student"
                  className="w-full h-24 object-contain bg-gray-900 rounded"
                />
              ) : (
                <div className="h-24 flex items-center justify-center text-gray-500 text-xs">
                  📷 Student photo will appear here
                </div>
              )}
            </div>
            
            {/* Title */}
            <div className="bg-gray-700/30 rounded p-2">
              <h3 className="text-sm font-semibold text-white">
                {metadata.name || (
                  <span className="text-gray-500 italic">📝 Scholarship name will appear here</span>
                )}
              </h3>
            </div>
            
            {/* Description */}
            <div className="bg-gray-700/30 rounded p-2">
              <p className="text-xs text-gray-300 leading-relaxed">
                {metadata.description || (
                  <span className="text-gray-500 italic">📄 Description will appear here...</span>
                )}
              </p>
            </div>
            
            {/* Attributes */}
            <div className="bg-gray-700/30 rounded p-2">
              <h4 className="text-xs font-medium mb-2 text-gray-300">🎓 Academic Info</h4>
              {metadata.attributes.filter(attr => attr.value.trim() !== '').length > 0 ? (
                <div className="space-y-1">
                  {metadata.attributes
                    .filter(attr => attr.value.trim() !== '')
                    .map((attr, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span className="text-gray-400">{attr.trait_type}:</span>
                      <span className="text-white">{attr.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic">Fill attributes to see them here</div>
              )}
            </div>
            
            {/* Contact */}
            <div className="bg-gray-700/30 rounded p-2">
              <h4 className="text-xs font-medium mb-2 text-gray-300">📞 Contact</h4>
              {(metadata.contact.email || metadata.contact.twitter) ? (
                <div className="space-y-1">
                  {metadata.contact.email && (
                    <div className="text-xs text-blue-400">✉️ {metadata.contact.email}</div>
                  )}
                  {metadata.contact.twitter && (
                    <div className="text-xs text-blue-400">🐦 {metadata.contact.twitter}</div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic">Contact info will appear here</div>
              )}
            </div>
            
            {/* Documents */}
            <div className="bg-gray-700/30 rounded p-2">
              <h4 className="text-xs font-medium mb-2 text-gray-300">📎 Documents</h4>
              {metadata.documents.filter(doc => doc.name.trim() !== '' && doc.url.trim() !== '').length > 0 ? (
                <div className="space-y-1">
                  {metadata.documents
                    .filter(doc => doc.name.trim() !== '' && doc.url.trim() !== '')
                    .map((doc, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-xs text-white truncate">{doc.name}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-400 bg-gray-600 px-1 rounded">{doc.type}</span>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          🔗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic">Supporting documents will appear here</div>
              )}
            </div>

            {/* JSON Preview in Live Preview */}
            <div className="bg-gray-900/50 rounded p-2 border border-gray-600">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-medium text-gray-300">📋 Generated JSON</h4>
                <button
                  onClick={() => navigator.clipboard.writeText(jsonString)}
                  className="cursor-pointer text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
                  title="Copy JSON"
                >
                  📋
                </button>
              </div>
              
              <pre className="bg-gray-900 rounded p-2 text-xs text-green-400 overflow-x-auto max-h-64 overflow-y-auto">
                {jsonString}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Terms & Create Button */}
      <div className="mt-6 space-y-4">

        {/* Action Buttons */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold text-white mb-1">Ready to Create Your Scholarship?</h3>
              <p className="text-sm text-gray-400">
                Your metadata is automatically generated. Review the preview and click create when ready.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              
              <button
                type="button"
                disabled={validateRequiredFields().length > 0}
                className="cursor-pointer px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center"
                onClick={handleCreateClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Scholarship
              </button>
            </div>
          </div>
          
          {validateRequiredFields().length > 0 && (
            <div className="mt-3 p-2 bg-orange-900/20 rounded border border-orange-700">
              <p className="text-orange-400 text-xs mb-1">
                ⚠️ Please complete the following required fields:
              </p>
              <ul className="text-orange-300 text-xs space-y-1">
                {validateRequiredFields().map((field, index) => (
                  <li key={index}>• {field}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">⚠️ Confirm Scholarship Creation</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Data Completeness Check */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">📋 Data Completeness Check</h3>
                {(() => {
                  const missingFields = validateRequiredFields();
                  return missingFields.length === 0 ? (
                    <div className="bg-green-900/20 border border-green-700 rounded p-3">
                      <p className="text-green-400 text-sm">✅ All required fields are complete!</p>
                    </div>
                  ) : (
                    <div className="bg-red-900/20 border border-red-700 rounded p-3">
                      <p className="text-red-400 text-sm mb-2">❌ Missing required fields:</p>
                      <ul className="text-red-300 text-sm space-y-1">
                        {missingFields.map((field, index) => (
                          <li key={index}>• {field}</li>
                        ))}
                      </ul>
                    </div>
                  );
                })()}
              </div>

              {/* Blockchain Warning */}
              <div className="mb-6">
                <div className="bg-yellow-900/20 border border-yellow-700 rounded p-4">
                  <h3 className="text-lg font-medium text-yellow-400 mb-2">🔗 Blockchain Permanency Warning</h3>
                  <div className="text-sm text-yellow-100 space-y-2">
                    <p><strong>⚠️ IMPORTANT:</strong> Once created, your scholarship data will be stored permanently on the blockchain and <strong>CANNOT be deleted or modified</strong>.</p>
                    <ul className="space-y-1 text-yellow-200 ml-4">
                      <li>• Your information will be publicly visible</li>
                      <li>• Photo and documents will be stored as base64 data</li>
                      <li>• Smart contract interactions are irreversible</li>
                      <li>• All transactions are recorded permanently</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Data Preview Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">📄 Your Scholarship Summary</h3>
                <div className="bg-gray-700/50 rounded p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{metadata.name || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Photo:</span>
                    <span className="text-white">{metadata.image ? '✅ Uploaded' : '❌ Missing'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{metadata.contact.email || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Academic Info:</span>
                    <span className="text-white">
                      {metadata.attributes.filter(attr => attr.value.trim() !== '').length}/4 fields
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Documents:</span>
                    <span className="text-white">
                      {metadata.documents.filter(doc => doc.name.trim() !== '' && doc.url.trim() !== '').length} attached
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions Checkbox */}
              <div className="mb-6">
                <div className="bg-gray-700/30 rounded p-4">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <div className="text-sm">
                      <p className="text-white font-medium mb-1">I have read and agree to the Terms & Conditions</p>
                      <p className="text-gray-400">
                        I understand that my scholarship data will be stored permanently on the blockchain, 
                        that I will use any received funds for educational purposes only, and that all 
                        transactions are final and irreversible.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCreate}
                  disabled={!termsAccepted || validateRequiredFields().length > 0 || !onCreateScholarship}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Yes, Create Scholarship
                </button>
              </div>

              {/* Final Warning */}
              <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded">
                <p className="text-red-400 text-xs text-center">
                  ⚠️ By clicking "Yes, Create Scholarship Permanently", you acknowledge that this action is irreversible 
                  and your data will be permanently recorded on the blockchain.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipMetadataForm;