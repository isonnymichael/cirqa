import React, { useState } from 'react';
import { useSendTransaction } from 'thirdweb/react';
import { prepareContractCall } from 'thirdweb';
import { cirqaProtocolContract } from '@/lib/contracts';
import Spinner from '@/app/Spinner';

type CreateScholarshipModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onScholarshipCreated: () => void;
};

const CreateScholarshipModal: React.FC<CreateScholarshipModalProps> = ({
  isOpen,
  onClose,
  onScholarshipCreated,
}) => {
  const [metadata, setMetadata] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: sendTransaction } = useSendTransaction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const transaction = prepareContractCall({
        contract: cirqaProtocolContract,
        method: 'function createScholarship(string metadata) returns (uint256)',
        params: [metadata],
      });

      await sendTransaction(transaction, {
        onSuccess: (receipt) => {
          console.log('Scholarship created successfully:', receipt);
          onScholarshipCreated();
          onClose();
          setMetadata('');
        },
        onError: (err) => {
          console.error('Failed to create scholarship:', err);
          setError(err.message || 'Failed to create scholarship.');
        },
      });
    } catch (err: any) {
      console.error('Error preparing transaction:', err);
      setError(err.message || 'Error preparing transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Create New Scholarship</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="metadata" className="block text-sm font-medium text-gray-300 mb-2">
              IPFS Metadata Hash
            </label>
            <input
              type="text"
              id="metadata"
              className="w-full p-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500"
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              placeholder="e.g., Qm..."
              required
            />
            <div className="mt-2 text-xs text-gray-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Need help creating metadata? Use our{' '}
                <a 
                  href="/app/metadata" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                  onClick={() => {
                    // Keep the modal open when clicking the link
                    setTimeout(() => {
                      window.open('/app/metadata', '_blank');
                    }, 0);
                    return false;
                  }}
                >
                  Metadata Generator
                </a>
              </span>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">Error: {error}</p>}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" /> : 'Create Scholarship'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateScholarshipModal;