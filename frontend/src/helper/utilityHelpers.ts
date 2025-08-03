// Utility functions for formatting, validation, and error handling

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
    if (address.length <= startChars + endChars) {
        return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format currency amount with proper decimals
 */
export function formatCurrency(
    amount: bigint, 
    decimals: number = 18, 
    symbol: string = '', 
    maxDecimalPlaces: number = 4
): string {
    const divisor = BigInt(10 ** decimals);
    const quotient = amount / divisor;
    const remainder = amount % divisor;
    
    if (remainder === BigInt(0)) {
        return `${quotient.toString()}${symbol ? ' ' + symbol : ''}`;
    }
    
    let remainderStr = remainder.toString().padStart(decimals, '0');
    
    // Trim trailing zeros and limit decimal places
    remainderStr = remainderStr.replace(/0+$/, '');
    if (remainderStr.length > maxDecimalPlaces) {
        remainderStr = remainderStr.slice(0, maxDecimalPlaces);
    }
    
    if (remainderStr === '') {
        return `${quotient.toString()}${symbol ? ' ' + symbol : ''}`;
    }
    
    return `${quotient}.${remainderStr}${symbol ? ' ' + symbol : ''}`;
}

/**
 * Format percentage from basis points
 */
export function formatPercentage(basisPoints: bigint): string {
    const percentage = Number(basisPoints) / 100;
    return `${percentage.toFixed(2)}%`;
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate positive number input
 */
export function isValidAmount(amount: string): boolean {
    if (!amount || amount.trim() === '') return false;
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
}

/**
 * Handle contract call errors with user-friendly messages
 */
export function handleContractError(error: any): string {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    
    // Common error patterns
    if (errorMessage.includes('user rejected')) {
        return 'Transaction was rejected by user';
    }
    
    if (errorMessage.includes('insufficient funds')) {
        return 'Insufficient funds for this transaction';
    }
    
    if (errorMessage.includes('execution reverted')) {
        // Try to extract the revert reason
        const revertMatch = errorMessage.match(/execution reverted: (.+?)(?:\s|$|")/);
        if (revertMatch) {
            return `Transaction failed: ${revertMatch[1]}`;
        }
        return 'Transaction failed: Contract execution reverted';
    }
    
    if (errorMessage.includes('nonce too low')) {
        return 'Transaction nonce too low. Please try again.';
    }
    
    if (errorMessage.includes('gas')) {
        return 'Transaction failed due to gas issues. Please try again with higher gas.';
    }
    
    if (errorMessage.includes('network')) {
        return 'Network error. Please check your connection and try again.';
    }
    
    // Return the original error message if no pattern matches
    return `Transaction failed: ${errorMessage}`;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            
            if (i === maxRetries - 1) {
                throw lastError;
            }
            
            const delay = baseDelay * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError!;
}

/**
 * Create a delay function
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Convert a number to BigInt with proper decimal handling
 */
export function toBigInt(value: string | number, decimals: number = 18): bigint {
    const stringValue = typeof value === 'number' ? value.toString() : value;
    const [whole, fractional = ''] = stringValue.split('.');
    const fractionalPadded = fractional.padEnd(decimals, '0').slice(0, decimals);
    const combinedStr = whole + fractionalPadded;
    return BigInt(combinedStr);
}

/**
 * Convert BigInt to number with decimal handling (use with caution for large numbers)
 */
export function fromBigInt(value: bigint, decimals: number = 18): number {
    const divisor = BigInt(10 ** decimals);
    const quotient = value / divisor;
    const remainder = value % divisor;
    
    const quotientNum = Number(quotient);
    const remainderNum = Number(remainder) / (10 ** decimals);
    
    return quotientNum + remainderNum;
}

/**
 * Check if a string is a valid number
 */
export function isNumeric(str: string): boolean {
    return !isNaN(Number(str)) && !isNaN(parseFloat(str));
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sleep function for async operations
 */
export const sleep = (ms: number): Promise<void> => delay(ms);

/**
 * Safe JSON parse that returns null on error
 */
export function safeJsonParse<T>(str: string): T | null {
    try {
        return JSON.parse(str) as T;
    } catch {
        return null;
    }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string): string {
    return str.replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}