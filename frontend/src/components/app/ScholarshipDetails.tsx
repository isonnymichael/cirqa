'use client';

import React, { useEffect, useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { 
  getScholarshipMetadata,
  getScholarshipOwner,
  hasEnoughBalance,
  getWithdrawalHistory,
  getScholarshipScore,
  getScholarshipData,
  getScholarshipRatingStats,
  getInvestorRating,
  rateScholarship,
  getMinRatingTokens,
  getCirqaBalance,
  formatCurrency,
  formatAddress,
  handleContractError,
  retryWithBackoff,
  parseMetadata,
  fetchIpfsMetadata,
  convertIpfsToHttp,
  ParsedMetadata,
  RateScholarshipParams,
  InvestorRating
} from '@/helper';
import FundScholarshipModal from './FundScholarshipModal';
import WithdrawFundsModal from './WithdrawFundsModal';
import RatingModal from './RatingModal';
import Spinner from '@/app/Spinner';

type ScholarshipDetailsProps = {
  scholarshipId: number;
  onClose: () => void;
};

type ScholarshipData = {
  id: number;
  student: string;
  balance: bigint;
  metadata: string;
  score: bigint;
  withdrawalHistory: {
    amounts: bigint[];
    timestamps: bigint[];
  };
  totalWithdrawn: bigint;
  exists: boolean;
};

const ScholarshipDetails: React.FC<ScholarshipDetailsProps> = ({ scholarshipId, onClose }) => {
  const [scholarship, setScholarship] = useState<ScholarshipData | null>(null);
  const [parsedMetadata, setParsedMetadata] = useState<ParsedMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [ratingStats, setRatingStats] = useState<{
    averageScore: number;
    totalRatings: number;
    totalTokensUsed: bigint;
  } | null>(null);
  const [investorRating, setInvestorRating] = useState<InvestorRating | null>(null);
  const [cirqaBalance, setCirqaBalance] = useState<bigint>(BigInt(0));
  const [minRatingTokens, setMinRatingTokens] = useState<bigint>(BigInt(0));
  
  const account = useActiveAccount();

  const fetchScholarshipData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all scholarship data in parallel
      const [scholarshipData, withdrawalHistory, score, stats, minTokens] = await Promise.all([
        retryWithBackoff(() => getScholarshipData(scholarshipId)),
        retryWithBackoff(() => getWithdrawalHistory(scholarshipId)),
        retryWithBackoff(() => getScholarshipScore(scholarshipId)).catch(() => BigInt(0)), // Score might not exist
        retryWithBackoff(() => getScholarshipRatingStats(scholarshipId)).catch(() => ({ averageScore: 0, totalRatings: 0, totalTokensUsed: BigInt(0) })),
        retryWithBackoff(() => getMinRatingTokens()).catch(() => BigInt(0))
      ]);
      
      // Set rating stats and min tokens
      setRatingStats(stats);
      setMinRatingTokens(minTokens);
      
      // Fetch investor rating and Cirqa balance if user is connected and not the owner
      if (account?.address && account.address.toLowerCase() !== scholarshipData.student.toLowerCase()) {
        try {
          const [rating, balance] = await Promise.all([
            getInvestorRating(scholarshipId, account.address),
            getCirqaBalance(account.address)
          ]);
          setInvestorRating(rating);
          setCirqaBalance(balance);
        } catch (error) {
          console.error('Error fetching investor data:', error);
          setInvestorRating(null);
          setCirqaBalance(BigInt(0));
        }
      }

      // Calculate total withdrawn
      const totalWithdrawn = withdrawalHistory.amounts.reduce((sum, amount) => sum + amount, BigInt(0));

        setScholarship({
          id: scholarshipId,
        student: scholarshipData.student,
        balance: scholarshipData.balance,
        metadata: scholarshipData.metadata,
        score,
        withdrawalHistory,
        totalWithdrawn,
        exists: true
      });

      // Parse metadata
      const basicParsed = parseMetadata(scholarshipData.metadata);
      
      if (basicParsed.ipfsUrl) {
        // Need to fetch from IPFS
        try {
          const fetchedMetadata = await fetchIpfsMetadata(basicParsed.ipfsUrl, scholarshipId);
          setParsedMetadata(fetchedMetadata);
        } catch (error) {
          console.error('Error fetching IPFS metadata:', error);
          setParsedMetadata(basicParsed);
        }
      } else {
        // Metadata is already parsed
        setParsedMetadata(basicParsed);
      }

    } catch (err: any) {
      console.error('Error fetching scholarship details:', err);
      const errorMessage = handleContractError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scholarshipId) {
      fetchScholarshipData();
    }
  }, [scholarshipId]);

  const handleRetry = () => {
    fetchScholarshipData();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleFundComplete = () => {
    setShowFundModal(false);
    fetchScholarshipData(); // Refresh data
  };

  const handleWithdrawComplete = () => {
    setShowWithdrawModal(false);
    fetchScholarshipData(); // Refresh data
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
        <Spinner size="lg" />
          <p className="text-gray-400 mt-4">Loading scholarship details...</p>
        </div>
      </div>
    );
  }

  if (error || !scholarship) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-center">
        <div className="text-red-500 text-xl mb-2">⚠</div>
        <p className="text-red-400 mb-4">{error || 'Scholarship not found'}</p>
        <div className="flex justify-center mt-4 space-x-3">
          <button 
            onClick={handleRetry}
            className="cursor-pointer px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors"
          >
            Try Again
          </button>
          <button 
            onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const isOwner = account?.address.toLowerCase() === scholarship.student.toLowerCase();

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-sm text-gray-400 mb-2">ID: #{scholarship.id}</p>
                    <div className="flex items-center space-x-3">
            <span className="inline-block text-sm bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full">
              {isOwner ? 'Your Scholarship' : 'Available for Funding'}
        </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="cursor-pointer text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Student Information */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-blue-400">👤 Student Information</h3>
          <div className="space-y-4">
            {/* Student Photo */}
            <div className="flex items-center space-x-4">
              {parsedMetadata?.image ? (
                <img
                  src={parsedMetadata.image}
                  alt={parsedMetadata.name}
                  className="w-20 h-20 rounded-xl object-cover bg-gray-700 border-2 border-gray-600 cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => setShowImagePreview(true)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-1">Student Name</p>
                <p className="text-white font-medium">{parsedMetadata?.name || 'Anonymous Student'}</p>
              </div>
            </div>
            
            {/* Wallet Address */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Wallet Address</p>
              <div className="flex items-center space-x-2 bg-gray-800 p-3 rounded-lg">
                <p className="font-mono text-sm text-white flex-1 break-all">{scholarship.student}</p>
                <button
                  onClick={() => copyToClipboard(scholarship.student)}
                  className="cursor-pointer flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
                  title="Copy address"
                >
                  {copiedAddress ? (
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              {copiedAddress && (
                <p className="text-xs text-green-400 mt-1">✓ Address copied to clipboard</p>
              )}
            </div>
            
            {/* Score Information */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Student Score</p>
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-yellow-400">
                      {ratingStats ? ratingStats.averageScore.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-yellow-400">⭐</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {ratingStats ? ratingStats.totalRatings : 0} ratings
                    </p>
                    <p className="text-xs text-gray-400">
                      {ratingStats ? formatCurrency(ratingStats.totalTokensUsed, 18, '', 0) : '0'} CIRQA used
                    </p>
                  </div>
                </div>
                
                {/* Your rating (if investor has rated) */}
                {investorRating && (
                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <p className="text-xs text-blue-400 mb-1">Your Rating:</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-blue-400">{investorRating.score}/10</span>
                      <span className="text-xs text-gray-400">
                        ({formatCurrency(investorRating.tokens, 18, '', 2)} CIRQA)
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(Number(investorRating.timestamp) * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Financial Summary */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-green-400">💰 Financial Summary</h3>
          <div className="space-y-3">
            <div className="bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-gray-400">Current Balance</p>
              <p className="text-xl font-semibold text-blue-400">
                {formatCurrency(scholarship.balance, 6, '', 2)} USDT
              </p>
            </div>
            <div className="bg-green-900/20 p-3 rounded-lg">
              <p className="text-sm text-gray-400">Total Withdrawn</p>
              <p className="text-xl font-semibold text-green-400">
                {formatCurrency(scholarship.totalWithdrawn, 6, '', 2)} USDT
              </p>
            </div>
            <div className="bg-purple-900/20 p-3 rounded-lg">
              <p className="text-sm text-gray-400">Total Funded</p>
              <p className="text-xl font-semibold text-purple-400">
                {formatCurrency(scholarship.balance + scholarship.totalWithdrawn, 6, '', 2)} USDT
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Detailed Metadata Display */}
      {parsedMetadata && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Description */}
          <div className="bg-gray-700/30 rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2 text-blue-400">📝 Description</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {parsedMetadata.description || 'No description provided'}
            </p>
          </div>

          {/* Academic Information */}
          <div className="bg-gray-700/30 rounded-lg p-3">
            <h3 className="text-sm font-semibold mb-2 text-yellow-400">🎓 Academic Info</h3>
            {parsedMetadata.attributes.length > 0 ? (
              <div className="space-y-1">
                {parsedMetadata.attributes.map((attr, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-gray-400">{attr.trait_type}:</span>
                    <span className="text-white font-medium">{attr.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No academic information provided</p>
            )}
          </div>
        </div>
      )}

      {/* Contact & Documents */}
      {parsedMetadata && (parsedMetadata.contact.email || parsedMetadata.contact.twitter || parsedMetadata.documents.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Contact Information */}
          {(parsedMetadata.contact.email || parsedMetadata.contact.twitter) && (
            <div className="bg-gray-700/30 rounded-lg p-3">
              <h3 className="text-sm font-semibold mb-2 text-green-400">📞 Contact</h3>
              <div className="space-y-1">
                {parsedMetadata.contact.email && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">✉️</span>
                    <a 
                      href={`mailto:${parsedMetadata.contact.email}`}
                      className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {parsedMetadata.contact.email}
                    </a>
                  </div>
                )}
                {parsedMetadata.contact.twitter && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">🐦</span>
                    <a 
                      href={`https://twitter.com/${parsedMetadata.contact.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {parsedMetadata.contact.twitter}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Supporting Documents */}
          {parsedMetadata.documents.length > 0 && (
            <div className="bg-gray-700/30 rounded-lg p-3">
              <h3 className="text-sm font-semibold mb-2 text-orange-400">📎 Documents</h3>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {parsedMetadata.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-xs text-white truncate flex-1">{doc.name}</span>
                    <div className="flex items-center space-x-1 ml-2">
                      <span className="text-xs text-gray-400 bg-gray-600 px-1 rounded">{doc.type}</span>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        title="Open document"
                      >
                        🔗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Withdrawal History */}
      <div className="bg-gray-700/30 rounded-lg p-3 mb-4">
        <h3 className="text-sm font-semibold mb-2 text-red-400">📈 Withdrawal History</h3>
        
        {scholarship.withdrawalHistory.amounts.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            <p className="text-xs">No withdrawals yet</p>
            {isOwner && (
              <p className="text-xs mt-1">Withdrawal records will appear here</p>
            )}
          </div>
        ) : (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {scholarship.withdrawalHistory.amounts.map((amount, index) => {
              const timestamp = scholarship.withdrawalHistory.timestamps[index];
              const date = new Date(Number(timestamp) * 1000);
              
              return (
                <div key={index} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                  <div>
                    <p className="text-sm font-semibold text-green-400">
                      {formatCurrency(amount, 6, '', 2)} USDT
                    </p>
                    <p className="text-xs text-gray-400">
                      {date.toLocaleDateString()} {date.toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
                <div className="flex items-center space-x-3">
          {/* Fund Button - Show if not owner */}
          {!isOwner && (
            <button
              onClick={() => setShowFundModal(true)}
              className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              💰 Fund Scholarship
            </button>
          )}
          
          {/* Rate Button - Show if not owner and has Cirqa balance */}
          {!isOwner && account && cirqaBalance >= minRatingTokens && (
            <button
              onClick={() => setShowRatingModal(true)}
              className="cursor-pointer px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm"
            >
              ⭐ {investorRating ? 'Update Rating' : 'Rate Student'}
            </button>
          )}
          
          {/* Show CIRQA requirement if user can't rate */}
          {!isOwner && account && cirqaBalance < minRatingTokens && minRatingTokens > BigInt(0) && (
            <div className="text-xs text-yellow-400 bg-yellow-900/20 px-3 py-2 rounded">
              Need {formatCurrency(minRatingTokens, 18, '', 0)} CIRQA to rate
            </div>
          )}
          
          {/* Withdraw Button - Show if owner and balance > 0 */}
          {isOwner && scholarship.balance > BigInt(0) && (
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              💸 Withdraw Funds
            </button>
          )}
          
        <button
          onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
        >
            Close Details
        </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {showImagePreview && parsedMetadata?.image && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowImagePreview(false)}>
          <div className="max-w-4xl max-h-4xl p-4">
            <img
              src={parsedMetadata.image}
              alt={parsedMetadata.name}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 transition-opacity cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Fund Modal */}
      {showFundModal && (
        <FundScholarshipModal
          isOpen={showFundModal}
          onClose={() => setShowFundModal(false)}
          onFundComplete={handleFundComplete}
          scholarship={{
            id: scholarship.id,
            student: scholarship.student,
            balance: scholarship.balance,
            metadata: scholarship.metadata,
            exists: scholarship.exists
          }}
        />
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <WithdrawFundsModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          onWithdrawComplete={handleWithdrawComplete}
          scholarship={{
            id: scholarship.id,
            student: scholarship.student,
            balance: scholarship.balance,
            metadata: scholarship.metadata,
            exists: scholarship.exists
          }}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          scholarshipId={scholarship.id}
          studentName={parsedMetadata?.name || `Scholarship #${scholarship.id}`}
          currentRating={investorRating}
          cirqaBalance={cirqaBalance}
          minRatingTokens={minRatingTokens}
          onClose={() => setShowRatingModal(false)}
          onRatingComplete={() => {
            setShowRatingModal(false);
            fetchScholarshipData(); // Refresh all data
          }}
        />
      )}
    </div>
  );
};

export default ScholarshipDetails;