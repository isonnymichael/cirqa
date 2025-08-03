# Cirqa Smart Contract Helpers

This directory contains helper functions for interacting with Cirqa smart contracts using Thirdweb v5.105.

## Environment Variables Required

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_CIRQA_TOKEN_ADDRESS=your_cirqa_token_address
NEXT_PUBLIC_USDT_TOKEN_ADDRESS=your_usdt_token_address
NEXT_PUBLIC_CIRQA_CORE=your_core_contract_address
NEXT_PUBLIC_SCHOLARSHIP_MANAGER=your_scholarship_manager_address
NEXT_PUBLIC_SCORE_MANAGER=your_score_manager_address
```

## Helper Files

### `scholarshipHelpers.ts`
Core scholarship functionality:
- Create scholarships
- Fund scholarships
- Withdraw funds
- Query scholarship data

### `tokenHelpers.ts`
Token operations:
- USDT/Cirqa token balances
- Token transfers
- Approvals
- Token information

### `adminHelpers.ts`
Admin functions (owner only):
- Update protocol settings
- Manage contract addresses
- Configure fees and rewards

### `scoreHelpers.ts`
Score management:
- Get scholarship scores
- Update scores (admin)

### `utilityHelpers.ts`
Utility functions:
- Address/amount formatting
- Error handling
- Validation helpers

## Usage Examples

### Creating a Scholarship

```typescript
import { createScholarship } from '@/helper';
import { useActiveAccount } from 'thirdweb/react';

const account = useActiveAccount();

try {
  const txHash = await createScholarship({
    metadata: "ipfs://QmYourMetadataHash",
    account: account!
  });
  console.log('Scholarship created:', txHash);
} catch (error) {
  console.error('Error creating scholarship:', error);
}
```

### Funding a Scholarship

```typescript
import { fundScholarship, parseTokenAmount } from '@/helper';
import { useActiveAccount } from 'thirdweb/react';

const account = useActiveAccount();

try {
  const amount = parseTokenAmount("100", 6); // 100 USDT (6 decimals)
  const txHash = await fundScholarship({
    tokenId: 1,
    amount,
    account: account!
  });
  console.log('Scholarship funded:', txHash);
} catch (error) {
  console.error('Error funding scholarship:', error);
}
```

### Getting Token Balances

```typescript
import { getAllTokenBalances, formatCurrency } from '@/helper';

const address = "0x123...";

try {
  const balances = await getAllTokenBalances(address);
  
  console.log('USDT Balance:', formatCurrency(balances.usdt.balance, balances.usdt.decimals, 'USDT'));
  console.log('Cirqa Balance:', formatCurrency(balances.cirqa.balance, balances.cirqa.decimals, 'CIRQA'));
} catch (error) {
  console.error('Error getting balances:', error);
}
```

### Withdrawing Funds

```typescript
import { withdrawFunds, parseTokenAmount } from '@/helper';
import { useActiveAccount } from 'thirdweb/react';

const account = useActiveAccount();

try {
  const amount = parseTokenAmount("50", 6); // 50 USDT
  const txHash = await withdrawFunds({
    tokenId: 1,
    amount,
    account: account!
  });
  console.log('Funds withdrawn:', txHash);
} catch (error) {
  console.error('Error withdrawing funds:', error);
}
```

### Error Handling

```typescript
import { handleContractError } from '@/helper';

try {
  // ... contract call
} catch (error) {
  const userFriendlyMessage = handleContractError(error);
  // Show userFriendlyMessage to user
}
```

### Admin Functions

```typescript
import { updateRewardRate, isOwner } from '@/helper';
import { useActiveAccount } from 'thirdweb/react';

const account = useActiveAccount();

// Check if user is owner
const ownerStatus = await isOwner(account?.address || '');

if (ownerStatus) {
  // Update reward rate (admin only)
  const txHash = await updateRewardRate({
    newRate: BigInt("2000000000000000000"), // 2 Cirqa per 1 USDT
    account: account!
  });
}
```

## Type Safety

All helper functions are fully typed with TypeScript interfaces. Import the types you need:

```typescript
import type { 
  CreateScholarshipParams, 
  FundScholarshipParams,
  TokenBalance 
} from '@/helper';
```

## Error Handling

All helper functions include proper error handling and will throw descriptive errors. Use try-catch blocks and the `handleContractError` utility for user-friendly error messages.