'use client';

import React, { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { 
  rateScholarship, 
  formatCurrency,
  parseTokenAmount,
  handleContractError,
  InvestorRating
} from '@/helper';
import Spinner from '@/app/Spinner';

type RatingModalProps = {
  scholarshipId: number;
  studentName: string;
  currentRating: InvestorRating | null;
  cirqaBalance: bigint;
  minRatingTokens: bigint;
  onClose: () => void;
  onRatingComplete: () => void;
};

const RatingModal: React.FC<RatingModalProps> = ({
  scholarshipId,
  studentName,
  currentRating,
  cirqaBalance,
  minRatingTokens,
  onClose,
  onRatingComplete
}) => {
  const [score, setScore] = useState<number | null>(currentRating?.score || null);
  const [tokenAmount, setTokenAmount] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  
  const account = useActiveAccount();

  // Calculate required CIRQA tokens based on score
  const calculateRequiredTokens = (rating: number): bigint => {
    // Base requirement increases with higher ratings
    // Score 1-3: minRatingTokens
    // Score 4-6: minRatingTokens * 2  
    // Score 7-8: minRatingTokens * 3
    // Score 9-10: minRatingTokens * 5
    if (rating >= 1 && rating <= 3) {
      return minRatingTokens;
    } else if (rating >= 4 && rating <= 6) {
      return minRatingTokens * BigInt(2);
    } else if (rating >= 7 && rating <= 8) {
      return minRatingTokens * BigInt(3);
    } else if (rating >= 9 && rating <= 10) {
      return minRatingTokens * BigInt(5);
    }
    return minRatingTokens;
  };

  // Check if user can afford a specific rating
  const canAffordRating = (rating: number): boolean => {
    const requiredTokens = calculateRequiredTokens(rating);
    return cirqaBalance >= requiredTokens;
  };

  // Update token amount when score changes
  useEffect(() => {
    if (score !== null) {
      const requiredTokens = calculateRequiredTokens(score);
      setTokenAmount(formatCurrency(requiredTokens, 18, '', 2));
    } else {
      setTokenAmount('0');
    }
  }, [score, minRatingTokens]);

  // Handle score selection with balance check
  const handleScoreSelect = (rating: number) => {
    if (!canAffordRating(rating)) {
      setError(`Insufficient CIRQA balance. Need ${formatCurrency(calculateRequiredTokens(rating), 18, '', 2)} CIRQA for rating ${rating}`);
      return;
    }
    setError(null);
    setScore(rating);
  };

  const handleSubmit = async () => {
    if (!account) {
      setError('Please connect your wallet');
      return;
    }

    if (score === null) {
      setError('Please select a rating score');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tokenAmountBigInt = parseTokenAmount(tokenAmount, 18);
      
      if (!canAffordRating(score)) {
        throw new Error('Insufficient CIRQA balance for this rating');
      }

      const txHash = await rateScholarship({
        tokenId: scholarshipId,
        score,
        amount: tokenAmountBigInt,
        account
      });

      console.log('✅ Rating submitted successfully:', txHash);
      onRatingComplete();
    } catch (err: any) {
      console.error('❌ Error submitting rating:', err);
      const errorMessage = handleContractError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    setStep('confirm');
  };

  const handleBack = () => {
    setStep('input');
    setError(null);
  };

  const isFormValid = () => {
    if (score === null) return false;
    if (!tokenAmount || tokenAmount.trim() === '' || tokenAmount === '0') return false;
    return canAffordRating(score);
  };

  const starRating = Array.from({ length: 10 }, (_, i) => i + 1);

  if (step === 'confirm') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-gray-800 rounded-lg p-4 md:p-6 max-w-md w-full border border-gray-700 my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-center">
            {currentRating ? 'Update Rating' : 'Confirm Rating'}
          </h3>
          
          <div className="bg-gray-700/30 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
            <div className="text-center mb-3 md:mb-4">
              <p className="text-gray-400 text-xs md:text-sm mb-2">Rating for</p>
              <p className="font-semibold text-white text-sm md:text-base">{studentName}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-3 md:mb-4">
              <div className="text-center">
                <p className="text-gray-400 text-xs md:text-sm">Score</p>
                <div className="flex items-center space-x-1">
                  <span className={`text-xl md:text-2xl font-bold ${score && score < 3 ? 'text-red-400' : 'text-yellow-400'}`}>{score}</span>
                  <span className={score && score < 3 ? 'text-red-400' : 'text-yellow-400'}>⭐</span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-400 text-xs md:text-sm">CIRQA Amount</p>
                <p className="text-base md:text-lg font-semibold text-blue-400">
                  {tokenAmount} CIRQA
                </p>
              </div>
            </div>
            
            <div className="border-t border-gray-600 pt-2 md:pt-3">
              <p className="text-xs text-gray-400 text-center">
                {currentRating ? 'This will update your previous rating' : 'Your tokens will be used to weight this rating'}
              </p>
            </div>
          </div>
          
          {/* Low Rating Warning in Confirm Step */}
          {score !== null && score < 3 && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg">
              <div className="flex items-start space-x-2">
                <span className="text-red-400 text-lg flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-red-400 font-medium text-sm">Low Rating Warning</p>
                  <p className="text-red-300 text-xs mt-1 leading-relaxed">
                    You're submitting a low rating ({score}/10). This may contribute to freezing the scholarship 
                    if the total average drops below 3.0.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded p-2 md:p-3 mb-3 md:mb-4">
              <p className="text-red-400 text-xs md:text-sm break-words">{error}</p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleBack}
              disabled={loading}
              className="cursor-pointer flex-1 px-3 md:px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm md:text-base"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="cursor-pointer flex-1 px-3 md:px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center text-sm md:text-base"
            >
              {loading ? (
                <div className="text-center">
                  <Spinner size="sm" />
                  <span className="ml-2">Rating...</span>
                </div>
              ) : (
                `⭐ ${currentRating ? 'Update' : 'Submit'} Rating`
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg p-4 md:p-6 max-w-md w-full border border-gray-700 my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex justify-between items-start mb-3 md:mb-4">
          <h3 className="text-lg md:text-xl font-bold">
            {currentRating ? 'Update Rating' : 'Rate Student'}
          </h3>
          <button
            onClick={onClose}
            className="cursor-pointer text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-400 text-sm mb-2">Rating for</p>
          <p className="font-semibold text-white">{studentName}</p>
        </div>
        
        {/* Score Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Score (1-10) - Select a rating
          </label>
          <div className="grid grid-cols-10 gap-1">
            {starRating.map((rating) => {
              const canAfford = canAffordRating(rating);
              const isSelected = score === rating;
              const requiredTokens = calculateRequiredTokens(rating);
              
              return (
                <button
                  key={rating}
                  onClick={() => handleScoreSelect(rating)}
                  disabled={!canAfford}
                  title={
                    !canAfford 
                      ? `Need ${formatCurrency(requiredTokens, 18, '', 2)} CIRQA` 
                      : rating < 3
                      ? `⚠️ Low rating (${rating}/10) - May cause scholarship freeze if total average < 3.0`
                      : `Requires ${formatCurrency(requiredTokens, 18, '', 2)} CIRQA`
                  }
                  className={`aspect-square rounded-lg border-2 transition-all text-xs font-bold ${
                    isSelected
                      ? rating < 3
                        ? 'border-red-400 bg-red-400/20 text-red-400'
                        : 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                      : !canAfford
                      ? 'border-red-600 bg-red-900/20 text-red-400 cursor-not-allowed opacity-50'
                      : rating < 3
                      ? 'cursor-pointer border-orange-500 hover:border-red-400 text-orange-400 hover:text-red-400 bg-orange-900/10 hover:bg-red-900/20'
                      : 'cursor-pointer border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {rating}
                </button>
              );
            })}
          </div>
          <div className="flex justify-center mt-2">
            {score !== null ? (
              <div className="flex items-center space-x-1">
                <span className={`text-xl md:text-2xl font-bold ${score < 3 ? 'text-red-400' : 'text-yellow-400'}`}>{score}</span>
                <span className={score < 3 ? 'text-red-400' : 'text-yellow-400'}>⭐</span>
              </div>
            ) : (
              <div className="text-gray-400 text-sm">No rating selected</div>
            )}
          </div>
          
          {/* Low Rating Warning */}
          {score !== null && score < 3 && (
            <div className="mt-3 p-3 bg-red-900/20 border border-red-600 rounded-lg">
              <div className="flex items-start space-x-2">
                <span className="text-red-400 text-lg flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-red-400 font-medium text-sm">Low Rating Warning</p>
                  <p className="text-red-300 text-xs mt-1 leading-relaxed">
                    Rating {score}/10 is below the freeze threshold. If the scholarship's total average score drops below 3.0, 
                    it will be automatically frozen (funding and withdrawals disabled) until the average improves.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* CIRQA Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CIRQA Tokens to Use (Auto-calculated)
          </label>
          <div className="relative">
            <input
              type="text"
              value={tokenAmount}
              readOnly
              placeholder="Select a rating above"
              className="w-full p-3 bg-gray-600 border border-gray-500 rounded-md text-white placeholder-gray-400 cursor-not-allowed"
            />
            <div className="absolute right-3 top-3 text-gray-400 text-sm">
              CIRQA
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 mt-2 text-xs md:text-sm">
            <span className="text-gray-400">
              Min: {formatCurrency(minRatingTokens, 18, '', 0)} CIRQA
            </span>
            <span className="text-gray-400">
              Balance: {formatCurrency(cirqaBalance, 18, '', 2)} CIRQA
            </span>
          </div>
          {score !== null && (
            <div className="mt-2 p-2 bg-blue-900/20 border border-blue-800 rounded text-xs md:text-sm text-blue-300">
              💡 Rating {score}/10 requires {formatCurrency(calculateRequiredTokens(score), 18, '', 2)} CIRQA tokens
            </div>
          )}
        </div>
        
        {/* Current Rating Info */}
        {currentRating && (
          <div className="mb-6 bg-blue-900/20 border border-blue-800 rounded-lg p-3">
            <p className="text-blue-400 text-sm md:text-base font-medium mb-2">Current Rating:</p>
            <div className="flex items-center justify-between">
              <span className="text-blue-300 text-sm md:text-base">{currentRating.score}/10 ⭐</span>
              <span className="text-blue-300 text-xs md:text-sm">
                {formatCurrency(currentRating.tokens, 18, '', 2)} CIRQA
              </span>
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-800 rounded p-3">
            <p className="text-red-400 text-sm md:text-base break-words">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="mb-6 bg-gray-700/30 rounded-lg p-3">
          <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
            • Higher ratings require more CIRQA tokens<br/>
            • Rating 1-3: 1x requirement, 4-6: 2x, 7-8: 3x, 9-10: 5x<br/>
            • Higher token amounts give your rating more weight<br/>
            • You can update your rating anytime
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="cursor-pointer flex-1 px-3 md:px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-sm md:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isFormValid()}
            className="cursor-pointer flex-1 px-3 md:px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            {score === null ? 'Select Rating First' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;