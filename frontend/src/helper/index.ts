// Export all scholarship helpers
export * from './scholarshipHelpers';

// Export all token helpers
export * from './tokenHelpers';

// Export all admin helpers
export * from './adminHelpers';

// Export all score helpers
export * from './scoreHelpers';

// Export all utility helpers
export * from './utilityHelpers';

// Re-export commonly used types
export type {
    ScholarshipData,
    WithdrawalHistory,
    DetailedWithdrawalHistory,
    InvestorInfo,
    ScholarshipFunding,
    CreateScholarshipParams,
    FundScholarshipParams,
    WithdrawFundsParams
} from './scholarshipHelpers';

export type {
    TokenBalance,
    ApproveTokenParams,
    TransferTokenParams
} from './tokenHelpers';

// Additional exports for new allowance management functions
export {
    getCirqaAllowance,
    needsUSDTApproval,
    needsCirqaApproval,
    ensureUSDTApproval,
    ensureCirqaApproval
} from './tokenHelpers';

export type {
    UpdateRewardRateParams,
    UpdateProtocolFeeParams,
    UpdateUSDTContractParams,
    SetFrozenStatusParams,
    UpdateFreezeStatusParams
} from './adminHelpers';

export type {
    UpdateScoreParams,
    RateScholarshipParams,
    InvestorRating
} from './scoreHelpers';

// Utility helpers provide formatting and validation functions

// ===== NEW FEATURE EXPORTS =====

// Export new investor tracking functions
export {
    getScholarshipInvestors,
    getInvestorContribution,
    getTotalScholarshipFunding,
    getInvestorCount,
    getScholarshipFundingInfo,
    getDetailedInvestorInfo
} from './scholarshipHelpers';

// Export new freeze management functions
export {
    isScholarshipFrozen,
    shouldScholarshipBeFrozen,
    setScholarshipFrozenStatus,
    updateScholarshipFreezeStatus,
    getFreezeThreshold,
    getBatchFreezeStatus
} from './adminHelpers';

// Export new enhanced withdrawal functions
export {
    getDetailedWithdrawalHistory,
    getWithdrawalFee,
    getWithdrawalStats
} from './scholarshipHelpers';

// Export scholarship deletion functions
export {
    canDeleteScholarship,
    deleteScholarship
} from './scholarshipHelpers';