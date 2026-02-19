/**
 * NSE Fee Calculator — Pure Fee Calculation Functions
 *
 * This module contains only pure functions with no DOM access,
 * no side effects, and no global state. All functions are
 * independently unit-testable.
 *
 * @module calculator
 */

// ============================================
// Constants (Confirmed Rates as of Feb 2026)
// ============================================

/** NSE Transaction Levy: 0.12% */
const NSE_LEVY_RATE = 0.0012;

/** CMA Levy: 0.08% */
const CMA_LEVY_RATE = 0.0008;

/** CDSC Transaction Levy: 0.08% (confirmed per cdsc.co.ke Oct 2025) */
const CDSC_LEVY_RATE = 0.0008;

/** ICF / Guarantee Fund: 0.01% */
const ICF_LEVY_RATE = 0.0001;

/** VAT on Brokerage: 16% */
const VAT_RATE = 0.16;

/** Stamp Duty: KES 2 per every KES 10,000 bracket */
const STAMP_PER_BRACKET = 2;
const STAMP_BRACKET_SIZE = 10000;

/** Maximum iterations for break-even calculation */
const MAX_BREAK_EVEN_ITERATIONS = 10000;

/** Break-even price increment (KES 0.01) */
const PRICE_INCREMENT = 0.01;

// ============================================
// Utility Functions
// ============================================

/**
 * Round a number to 2 decimal places (KES cents)
 * @param {number} num - The number to round
 * @returns {number} Rounded to 2 decimal places
 */
function roundToCents(num) {
    return Math.round(num * 100) / 100;
}

/**
 * Format a number as KES currency string
 * @param {number} num - The number to format
 * @returns {string} Formatted currency string (e.g., "KES 1,234.56")
 */
function formatKES(num) {
    const rounded = roundToCents(num);
    return 'KES ' + rounded.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Calculate stamp duty on a consideration amount
 * Stamp duty is KES 2 for every KES 10,000 (or part thereof)
 * @param {number} consideration - Trade value in KES
 * @returns {number} Stamp duty in KES (always a multiple of 2)
 */
function calculateStampDuty(consideration) {
    const brackets = Math.ceil(consideration / STAMP_BRACKET_SIZE);
    return brackets * STAMP_PER_BRACKET;
}

/**
 * Get the number of stamp duty brackets for a consideration
 * @param {number} consideration - Trade value in KES
 * @returns {number} Number of brackets
 */
function getStampDutyBrackets(consideration) {
    return Math.ceil(consideration / STAMP_BRACKET_SIZE);
}

// ============================================
// Core Fee Calculation
// ============================================

/**
 * Calculate all fees for a single trade (buy or sell)
 *
 * @param {Object} params - Calculation parameters
 * @param {number} params.pricePerShare - Price per share in KES
 * @param {number} params.quantity - Number of shares
 * @param {number} params.brokerageRate - Brokerage rate as decimal (e.g., 0.015 for 1.5%)
 * @param {number} params.minBrokerageFee - Minimum brokerage fee in KES (0 if none)
 * @returns {FeeBreakdown} Complete fee breakdown
 */
function calculateFees({ pricePerShare, quantity, brokerageRate, minBrokerageFee }) {
    // Step 1: Consideration (trade value)
    const consideration = roundToCents(pricePerShare * quantity);

    // Step 2: Brokerage (apply minimum fee)
    const brokerageRaw = roundToCents(consideration * brokerageRate);
    const brokerage = roundToCents(Math.max(brokerageRaw, minBrokerageFee));
    const minFeeApplied = brokerage > brokerageRaw;

    // Step 3: VAT on Brokerage (16% of the final brokerage amount)
    const vatOnBrokerage = roundToCents(brokerage * VAT_RATE);

    // Step 4: Other percentage-based fees (applied to consideration)
    const nseLevy = roundToCents(consideration * NSE_LEVY_RATE);
    const cmaLevy = roundToCents(consideration * CMA_LEVY_RATE);
    const cdscFee = roundToCents(consideration * CDSC_LEVY_RATE);
    const icfLevy = roundToCents(consideration * ICF_LEVY_RATE);

    // Step 5: Stamp Duty
    const stampDuty = calculateStampDuty(consideration);
    const stampDutyBrackets = getStampDutyBrackets(consideration);

    // Step 6: Total fees
    const totalFees = roundToCents(
        brokerage + vatOnBrokerage + nseLevy + cmaLevy + cdscFee + icfLevy + stampDuty
    );

    // Step 7: Fee percentage
    const feePercentage = consideration > 0 ? (totalFees / consideration) * 100 : 0;

    return {
        consideration,
        brokerage,
        brokerageRaw,
        minFeeApplied,
        vatOnBrokerage,
        nseLevy,
        cmaLevy,
        cdscFee,
        icfLevy,
        stampDuty,
        stampDutyBrackets,
        totalFees,
        feePercentage: roundToCents(feePercentage)
    };
}

/**
 * Calculate the total cost for a BUY transaction
 *
 * @param {Object} params - Calculation parameters
 * @param {number} params.pricePerShare - Price per share in KES
 * @param {number} params.quantity - Number of shares
 * @param {number} params.brokerageRate - Brokerage rate as decimal
 * @param {number} params.minBrokerageFee - Minimum brokerage fee in KES
 * @returns {TradeResult} Complete buy trade result
 */
function calculateBuy({ pricePerShare, quantity, brokerageRate, minBrokerageFee }) {
    const fees = calculateFees({ pricePerShare, quantity, brokerageRate, minBrokerageFee });
    const totalCost = roundToCents(fees.consideration + fees.totalFees);

    return {
        direction: 'buy',
        ...fees,
        totalAmount: totalCost,
        amountLabel: 'YOU PAY'
    };
}

/**
 * Calculate the total proceeds for a SELL transaction
 *
 * @param {Object} params - Calculation parameters
 * @param {number} params.pricePerShare - Price per share in KES
 * @param {number} params.quantity - Number of shares
 * @param {number} params.brokerageRate - Brokerage rate as decimal
 * @param {number} params.minBrokerageFee - Minimum brokerage fee in KES
 * @returns {TradeResult} Complete sell trade result
 */
function calculateSell({ pricePerShare, quantity, brokerageRate, minBrokerageFee }) {
    const fees = calculateFees({ pricePerShare, quantity, brokerageRate, minBrokerageFee });
    const totalProceeds = roundToCents(fees.consideration - fees.totalFees);

    return {
        direction: 'sell',
        ...fees,
        totalAmount: totalProceeds,
        amountLabel: 'YOU RECEIVE'
    };
}

/**
 * Calculate trade cost based on direction
 *
 * @param {string} direction - 'buy' or 'sell'
 * @param {number} pricePerShare - Price per share in KES
 * @param {number} quantity - Number of shares
 * @param {number} brokerageRate - Brokerage rate as decimal
 * @param {number} minBrokerageFee - Minimum brokerage fee in KES
 * @returns {TradeResult} Complete trade result
 */
function calculateTrade(direction, pricePerShare, quantity, brokerageRate, minBrokerageFee) {
    if (direction === 'sell') {
        return calculateSell({ pricePerShare, quantity, brokerageRate, minBrokerageFee });
    }
    return calculateBuy({ pricePerShare, quantity, brokerageRate, minBrokerageFee });
}

// ============================================
// Break-Even Calculation
// ============================================

/**
 * Calculate the break-even price for a round trip (buy + sell)
 * Uses iterative algorithm for exact results (not approximation)
 *
 * @param {number} buyPrice - Price per share in KES (buy side)
 * @param {number} quantity - Number of shares
 * @param {number} brokerageRate - Brokerage rate as decimal
 * @param {number} minBrokerageFee - Minimum brokerage fee in KES
 * @returns {BreakEvenResult} Break-even price and percentage
 */
function calculateBreakEven(buyPrice, quantity, brokerageRate, minBrokerageFee) {
    // Calculate the total cost on the buy side
    const buyResult = calculateBuy({ pricePerShare: buyPrice, quantity, brokerageRate, minBrokerageFee });
    const buyTotalCost = buyResult.totalAmount;

    // Iterate to find the minimum sell price where proceeds >= buy total cost
    let sellPrice = buyPrice;

    for (let i = 0; i < MAX_BREAK_EVEN_ITERATIONS; i++) {
        sellPrice += PRICE_INCREMENT;
        const sellResult = calculateSell({ pricePerShare: sellPrice, quantity, brokerageRate, minBrokerageFee });

        if (sellResult.totalAmount >= buyTotalCost) {
            const breakEvenPrice = sellPrice;
            const breakEvenPct = ((breakEvenPrice - buyPrice) / buyPrice) * 100;

            return {
                breakEvenPrice: roundToCents(breakEvenPrice),
                breakEvenPct: roundToCents(breakEvenPct),
                iterations: i + 1
            };
        }
    }

    // Fallback if max iterations reached (should not happen in practice)
    return {
        breakEvenPrice: buyPrice * 1.1,
        breakEvenPct: 10,
        iterations: MAX_BREAK_EVEN_ITERATIONS
    };
}

// ============================================
// Sweet Spot Calculation
// ============================================

/**
 * Calculate the "sweet spot" quantity where stamp duty is fully utilized
 * within one KES 10,000 bracket (using FLOOR to stay in one bracket)
 *
 * @param {number} pricePerShare - Price per share in KES
 * @returns {number} Maximum shares before hitting second bracket
 */
function calculateSweetSpot(pricePerShare) {
    if (pricePerShare <= 0) return 0;
    return Math.floor(STAMP_BRACKET_SIZE / pricePerShare);
}

// ============================================
// Fee Impact Comparison
// ============================================

/**
 * Calculate fee impact at different trade quantities
 *
 * @param {number} pricePerShare - Price per share in KES
 * @param {number[]} quantities - Array of quantities to calculate
 * @param {number} brokerageRate - Brokerage rate as decimal
 * @param {number} minBrokerageFee - Minimum brokerage fee in KES
 * @returns {FeeImpactRow[]} Array of fee impact results
 */
function calculateFeeImpact(pricePerShare, quantities, brokerageRate, minBrokerageFee) {
    return quantities.map(qty => {
        const result = calculateBuy({ pricePerShare, quantity: qty, brokerageRate, minBrokerageFee });
        const stampDutyPct = (result.stampDuty / result.totalFees) * 100;

        return {
            quantity: qty,
            tradeValue: result.consideration,
            totalFees: result.totalFees,
            feePercentage: result.feePercentage,
            stampDuty: result.stampDuty,
            stampDutyPercentOfFees: roundToCents(stampDutyPct)
        };
    });
}

/**
 * Generate standard quantities for fee impact comparison
 * Returns quantities that show meaningful fee differences
 *
 * @param {number} pricePerShare - Price per share in KES
 * @returns {number[]} Array of quantities to compare
 */
function generateComparisonQuantities(pricePerShare) {
    const sweetSpot = calculateSweetSpot(pricePerShare);
    const baseQuantities = [1, 5, 10, 50, 100];

    // Add sweet spot if not already in list
    if (!baseQuantities.includes(sweetSpot)) {
        baseQuantities.push(sweetSpot);
    }

    // Add a quantity above sweet spot
    baseQuantities.push(sweetSpot + 1);

    // Sort and deduplicate
    return [...new Set(baseQuantities)].sort((a, b) => a - b);
}

// ============================================
// Broker Comparison
// ============================================

/**
 * Compare fees across all brokers for the same trade
 *
 * @param {number} pricePerShare - Price per share in KES
 * @param {number} quantity - Number of shares
 * @param {Broker[]} brokers - Array of broker configurations
 * @returns {BrokerComparisonResult[]} Array of broker comparison results
 */
function compareBrokers(pricePerShare, quantity, brokers) {
    return brokers.map(broker => {
        const result = calculateBuy({
            pricePerShare,
            quantity,
            brokerageRate: broker.brokerageRate,
            minBrokerageFee: broker.minFee
        });

        return {
            brokerId: broker.id,
            brokerName: broker.name,
            brokerageRate: broker.brokerageRate,
            minFee: broker.minFee,
            totalFees: result.totalFees,
            feePercentage: result.feePercentage
        };
    }).sort((a, b) => a.totalFees - b.totalFees);
}

// ============================================
// Fee Status Classification
// ============================================

/**
 * Get the fee status category based on percentage
 *
 * @param {number} feePercentage - Fee percentage
 * @returns {FeeStatus} Status object with class, label, and emoji
 */
function getFeeStatus(feePercentage) {
    if (feePercentage < 1.6) {
        return { class: 'low', label: 'Low fees', emoji: '🟢', color: 'var(--color-fee-low)' };
    }
    if (feePercentage < 3.0) {
        return { class: 'moderate', label: 'Moderate fees', emoji: '🟡', color: 'var(--color-fee-moderate)' };
    }
    if (feePercentage < 5.0) {
        return { class: 'high', label: 'High fees', emoji: '🟠', color: 'var(--color-fee-high)' };
    }
    return { class: 'very-high', label: 'Very high fees', emoji: '🔴', color: 'var(--color-fee-very-high)' };
}

/**
 * Check if stamp duty impact is significant (> 0.5% of trade value)
 *
 * @param {number} stampDuty - Stamp duty in KES
 * @param {number} consideration - Trade value in KES
 * @returns {boolean} True if stamp duty impact is significant
 */
function isStampDutySignificant(stampDuty, consideration) {
    if (consideration <= 0) return false;
    const stampDutyPct = (stampDuty / consideration) * 100;
    return stampDutyPct > 0.5;
}

/**
 * Get the fee verdict for a quantity range
 *
 * @param {number} quantity - Number of shares
 * @param {number} feePercentage - Fee percentage
 * @param {number} sweetSpot - Sweet spot quantity
 * @returns {Verdict} Verdict object with emoji and message
 */
function getVerdict(quantity, feePercentage, sweetSpot) {
    const sharesToSweetSpot = Math.max(0, sweetSpot - quantity);

    if (quantity >= sweetSpot) {
        return {
            emoji: '🟢',
            title: 'Sweet spot reached',
            message: `You are at ${quantity} shares. Sweet spot starts at ${sweetSpot} shares, where fixed stamp duty impact is minimized.`,
            class: 'optimal',
            sweetSpot,
            sharesToSweetSpot,
            actionLabel: ''
        };
    }
    if (feePercentage > 5) {
        return {
            emoji: '🔴',
            title: 'Too expensive right now',
            message: `Fees are ${feePercentage.toFixed(2)}% on this trade. Sweet spot is ${sweetSpot} shares — add ${sharesToSweetSpot} more shares to reduce fixed-fee drag.`,
            class: 'avoid',
            sweetSpot,
            sharesToSweetSpot,
            actionLabel: `Use sweet spot (${sweetSpot} shares)`
        };
    }
    if (feePercentage > 3) {
        return {
            emoji: '🟠',
            title: 'High fee zone',
            message: `Sweet spot is ${sweetSpot} shares. Add ${sharesToSweetSpot} more shares to bring fees closer to efficient levels.`,
            class: 'high',
            sweetSpot,
            sharesToSweetSpot,
            actionLabel: `Use sweet spot (${sweetSpot} shares)`
        };
    }
    if (feePercentage > 1.6) {
        return {
            emoji: '🟡',
            title: 'Near efficient range',
            message: `Sweet spot is at ${sweetSpot} shares — add ${sharesToSweetSpot} more shares to target fees below 1.6%.`,
            class: 'moderate',
            sweetSpot,
            sharesToSweetSpot,
            actionLabel: `Use sweet spot (${sweetSpot} shares)`
        };
    }
    return {
        emoji: '🟢',
        title: 'Good fee range',
        message: `Fees are already reasonable. Sweet spot is ${sweetSpot} shares if you want to squeeze costs further.`,
        class: 'good',
        sweetSpot,
        sharesToSweetSpot,
        actionLabel: sharesToSweetSpot > 0 ? `Use sweet spot (${sweetSpot} shares)` : ''
    };
}

// ============================================
// URL Parameter Handling
// ============================================

/**
 * Parse URL parameters for pre-filled values
 *
 * @param {string} queryString - URL query string (without the '?')
 * @returns {URLParams} Parsed parameters
 */
function parseURLParams(queryString) {
    const params = new URLSearchParams(queryString);
    return {
        ticker: params.get('ticker')?.toUpperCase() || null,
        qty: parseInt(params.get('qty') || '0', 10) || null,
        broker: params.get('broker') || null,
        direction: params.get('direction') === 'sell' ? 'sell' : 'buy'
    };
}

/**
 * Build URL string from calculation parameters
 *
 * @param {Object} params - Parameters to encode
 * @param {string} params.ticker - Stock ticker
 * @param {number} params.quantity - Number of shares
 * @param {string} params.brokerId - Broker ID
 * @param {string} params.direction - 'buy' or 'sell'
 * @returns {string} URL query string
 */
function buildURLParams({ ticker, quantity, brokerId, direction }) {
    const params = new URLSearchParams();
    if (ticker) params.set('ticker', ticker);
    if (quantity > 0) params.set('qty', quantity.toString());
    if (brokerId) params.set('broker', brokerId);
    if (direction) params.set('direction', direction);
    return params.toString();
}

// ============================================
// Validation
// ============================================

/**
 * Validate calculation inputs
 *
 * @param {Object} inputs - Input values to validate
 * @param {number} inputs.pricePerShare - Price per share
 * @param {number} inputs.quantity - Number of shares
 * @param {number} inputs.brokerageRate - Brokerage rate
 * @returns {ValidationResult} Validation result with errors if any
 */
function validateInputs({ pricePerShare, quantity, brokerageRate }) {
    const errors = [];

    if (pricePerShare <= 0) {
        errors.push('Price must be greater than 0');
    }
    if (quantity <= 0) {
        errors.push('Quantity must be at least 1');
    }
    if (quantity > 10000000) {
        errors.push('Quantity exceeds typical retail volume');
    }
    if (brokerageRate < 0 || brokerageRate > 1) {
        errors.push('Brokerage rate must be between 0% and 100%');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

// ============================================
// Export
// ============================================

export {
    // Constants
    NSE_LEVY_RATE,
    CMA_LEVY_RATE,
    CDSC_LEVY_RATE,
    ICF_LEVY_RATE,
    VAT_RATE,
    STAMP_PER_BRACKET,
    STAMP_BRACKET_SIZE,

    // Core calculations
    calculateFees,
    calculateBuy,
    calculateSell,
    calculateTrade,

    // Analysis functions
    calculateBreakEven,
    calculateSweetSpot,
    calculateFeeImpact,
    generateComparisonQuantities,
    compareBrokers,

    // Classification
    getFeeStatus,
    isStampDutySignificant,
    getVerdict,

    // URL handling
    parseURLParams,
    buildURLParams,

    // Utilities
    formatKES,
    roundToCents,
    validateInputs
};

// Type definitions for JSDoc

/**
 * @typedef {Object} FeeBreakdown
 * @property {number} consideration - Trade value in KES
 * @property {number} brokerage - Brokerage fee (with minimum applied if needed)
 * @property {number} brokerageRaw - Brokerage before minimum fee
 * @property {boolean} minFeeApplied - Whether minimum fee was applied
 * @property {number} vatOnBrokerage - VAT on brokerage (16%)
 * @property {number} nseLevy - NSE transaction levy (0.12%)
 * @property {number} cmaLevy - CMA levy (0.08%)
 * @property {number} cdscFee - CDSC fee (0.08%)
 * @property {number} icfLevy - ICF levy (0.01%)
 * @property {number} stampDuty - Stamp duty in KES
 * @property {number} stampDutyBrackets - Number of stamp duty brackets
 * @property {number} totalFees - Sum of all fees
 * @property {number} feePercentage - Fee as percentage of consideration
 */

/**
 * @typedef {Object} TradeResult
 * @property {string} direction - 'buy' or 'sell'
 * @property {number} consideration - Trade value in KES
 * @property {number} brokerage - Brokerage fee
 * @property {number} vatOnBrokerage - VAT on brokerage
 * @property {number} nseLevy - NSE levy
 * @property {number} cmaLevy - CMA levy
 * @property {number} cdscFee - CDSC fee
 * @property {number} icfLevy - ICF levy
 * @property {number} stampDuty - Stamp duty
 * @property {number} totalFees - Sum of all fees
 * @property {number} feePercentage - Fee as percentage
 * @property {number} totalAmount - Total cost (buy) or proceeds (sell)
 * @property {string} amountLabel - 'YOU PAY' or 'YOU RECEIVE'
 */

/**
 * @typedef {Object} BreakEvenResult
 * @property {number} breakEvenPrice - Price needed to break even
 * @property {number} breakEvenPct - Percentage increase needed
 * @property {number} iterations - Number of iterations used
 */

/**
 * @typedef {Object} FeeImpactRow
 * @property {number} quantity - Number of shares
 * @property {number} tradeValue - Total trade value
 * @property {number} totalFees - Total fees in KES
 * @property {number} feePercentage - Fee as percentage
 * @property {number} stampDuty - Stamp duty amount
 * @property {number} stampDutyPercentOfFees - Stamp duty as % of total fees
 */

/**
 * @typedef {Object} Broker
 * @property {string} id - Broker ID
 * @property {string} name - Broker name
 * @property {number} brokerageRate - Brokerage rate as decimal
 * @property {number} minFee - Minimum fee in KES
 */

/**
 * @typedef {Object} BrokerComparisonResult
 * @property {string} brokerId - Broker ID
 * @property {string} brokerName - Broker name
 * @property {number} brokerageRate - Brokerage rate
 * @property {number} minFee - Minimum fee
 * @property {number} totalFees - Total fees for this trade
 * @property {number} feePercentage - Fee percentage
 */

/**
 * @typedef {Object} FeeStatus
 * @property {string} class - CSS class name
 * @property {string} label - Human-readable label
 * @property {string} emoji - Emoji indicator
 * @property {string} color - CSS color value
 */

/**
 * @typedef {Object} Verdict
 * @property {string} emoji - Emoji indicator
 * @property {string} title - Verdict title
 * @property {string} message - Verdict message
 * @property {string} class - CSS class
 * @property {number} sweetSpot - Sweet spot quantity
 * @property {number} sharesToSweetSpot - Additional shares needed
 * @property {string} actionLabel - CTA text for quick action
 */

/**
 * @typedef {Object} URLParams
 * @property {string|null} ticker - Stock ticker symbol
 * @property {number|null} qty - Quantity
 * @property {string|null} broker - Broker ID
 * @property {string} direction - 'buy' or 'sell'
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether inputs are valid
 * @property {string[]} errors - Array of error messages
 */
