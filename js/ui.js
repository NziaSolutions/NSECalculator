/**
 * NSE Fee Calculator — UI Module
 *
 * Handles all DOM manipulation, event listeners, and rendering.
 * Uses calculator.js for all calculations (pure functions).
 *
 * @module ui
 */

import * as calc from './calculator.js';
import * as data from './data.js';
import { generateShareCard, shareResult } from './share.js';

// ============================================
// Utility Functions for Safe DOM Creation
// ============================================

/**
 * Create a table cell with text content
 * @param {string} text - Cell content
 * @returns {HTMLTableCellElement} Table cell element
 */
function createCell(text) {
    const cell = document.createElement('td');
    cell.textContent = text;
    return cell;
}

/**
 * Create an element with class and text content
 * @param {string} tag - HTML tag name
 * @param {string} className - CSS class name
 * @param {string} text - Text content
 * @returns {HTMLElement} Created element
 */
function createElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
}

// ============================================
// State
// ============================================

/**
 * Current calculator state
 * @type {CalculatorState}
 */
const state = {
    direction: 'buy',
    ticker: null,
    brokerId: 'ziidi',
    pricePerShare: 0,
    quantity: 10,
    customRate: null,
    customMinFee: 0
};

// ============================================
// DOM Elements
// ============================================

// Input elements
const els = {
    // Direction buttons
    directionBtns: document.querySelectorAll('.direction-btn'),

    // Form inputs
    stockSelect: document.getElementById('stockSelect'),
    brokerSelect: document.getElementById('brokerSelect'),
    priceInput: document.getElementById('priceInput'),
    quantityInput: document.getElementById('quantityInput'),
    qtyMinus: document.getElementById('qtyMinus'),
    qtyPlus: document.getElementById('qtyPlus'),

    // Custom broker inputs
    customBrokerGroup: document.getElementById('customBrokerGroup'),
    customRate: document.getElementById('customRate'),
    customMinFee: document.getElementById('customMinFee'),

    // Hints
    brokerHint: document.getElementById('brokerHint'),
    priceDateBadge: document.getElementById('priceDateBadge'),

    // Results
    resultsCard: document.getElementById('resultsCard'),
    resultsLabel: document.getElementById('resultsLabel'),
    resultsAmount: document.getElementById('resultsAmount'),
    feeThermometerBar: document.getElementById('feeThermometerBar'),
    feePercentValue: document.getElementById('feePercentValue'),
    feeEmoji: document.getElementById('feeEmoji'),
    feeAmount: document.getElementById('feeAmount'),
    stampDutyWarning: document.getElementById('stampDutyWarning'),
    stampDutyAmount: document.getElementById('stampDutyAmount'),
    stampDutyPercent: document.getElementById('stampDutyPercent'),
    resultsSummary: document.getElementById('resultsSummary'),
    minFeeWarning: document.getElementById('minFeeWarning'),
    minFeeWarningText: document.getElementById('minFeeWarningText'),

    // Breakdown
    bdSharesValue: document.getElementById('bdSharesValue'),
    bdBrokerage: document.getElementById('bdBrokerage'),
    bdBrokerageRate: document.getElementById('bdBrokerageRate'),
    bdVat: document.getElementById('bdVat'),
    bdNse: document.getElementById('bdNse'),
    bdCma: document.getElementById('bdCma'),
    bdCdsc: document.getElementById('bdCdsc'),
    bdIcf: document.getElementById('bdIcf'),
    bdStamp: document.getElementById('bdStamp'),
    bdTotalFees: document.getElementById('bdTotalFees'),
    bdTotalLabel: document.getElementById('bdTotalLabel'),
    bdGrandTotal: document.getElementById('bdGrandTotal'),

    // Sections
    impactSection: document.getElementById('impactSection'),
    impactTableBody: document.getElementById('impactTableBody'),
    verdictBox: document.getElementById('verdictBox'),
    breakEvenSection: document.getElementById('breakEvenSection'),
    breakEvenMain: document.getElementById('breakEvenMain'),
    breakEvenSub: document.getElementById('breakEvenSub'),
    brokerSection: document.getElementById('brokerSection'),
    brokerTableBody: document.getElementById('brokerTableBody'),

    // States
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),

    // Share
    shareBtn: document.getElementById('shareBtn'),
    priceUpdateDate: document.getElementById('priceUpdateDate')
};

// ============================================
// Initialization
// ============================================

/**
 * Initialize the calculator
 */
async function init() {
    // Fetch fresh prices from data/stocks.json (overlays embedded fallback prices)
    await data.loadPrices();

    populateStocks();
    populateBrokers();
    loadURLParams();
    attachEventListeners();
    updatePriceDateBadge();

    // Hide loading, show empty
    els.loadingState.hidden = true;
    els.emptyState.hidden = false;

    // Register service worker
    registerServiceWorker();
}

/**
 * Populate stock dropdown
 */
function populateStocks() {
    const stocks = data.getAllStocks();

    // Add popular stocks section
    const popularGroup = document.createElement('optgroup');
    popularGroup.label = 'Popular Stocks';

    // Add all stocks section
    const allGroup = document.createElement('optgroup');
    allGroup.label = 'All Stocks';

    stocks.forEach(stock => {
        const option = document.createElement('option');
        option.value = stock.ticker;
        option.textContent = `${stock.ticker} — ${stock.name}`;

        if (stock.isSuspended) {
            option.textContent += ' (Suspended)';
            option.disabled = true;
        }

        if (data.POPULAR_STOCKS.includes(stock.ticker)) {
            popularGroup.appendChild(option);
        } else {
            allGroup.appendChild(option);
        }
    });

    els.stockSelect.appendChild(popularGroup);
    els.stockSelect.appendChild(allGroup);
}

/**
 * Populate broker dropdown
 */
function populateBrokers() {
    const brokers = data.getAllBrokers();

    brokers.forEach(broker => {
        const option = document.createElement('option');
        option.value = broker.id;
        option.textContent = broker.name;
        els.brokerSelect.appendChild(option);
    });

    // Set default
    els.brokerSelect.value = data.DEFAULT_BROKER_ID;
    updateBrokerHint();
}

/**
 * Load parameters from URL
 */
function loadURLParams() {
    const params = calc.parseURLParams(window.location.search.substring(1));

    if (params.ticker) {
        const stock = data.getStock(params.ticker);
        if (stock) {
            els.stockSelect.value = stock.ticker;
            state.ticker = stock.ticker;
            els.priceInput.value = stock.price;
            state.pricePerShare = stock.price;
        }
    }

    if (params.broker) {
        const broker = data.getBroker(params.broker);
        if (broker) {
            els.brokerSelect.value = broker.id;
            state.brokerId = broker.id;
            updateBrokerHint();
        }
    }

    if (params.qty && params.qty > 0) {
        els.quantityInput.value = params.qty;
        state.quantity = params.qty;
    }

    if (params.direction) {
        setDirection(params.direction);
    }

    // Calculate if we have all required inputs
    if (state.ticker && state.pricePerShare > 0 && state.quantity > 0) {
        calculate();
    }
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    // Direction toggle
    els.directionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const dir = btn.dataset.direction;
            setDirection(dir);
            calculate();
        });
    });

    // Stock selection
    els.stockSelect.addEventListener('change', () => {
        const ticker = els.stockSelect.value;
        const stock = data.getStock(ticker);

        if (stock) {
            state.ticker = stock.ticker;
            els.priceInput.value = stock.price;
            state.pricePerShare = stock.price;
            updatePriceDateBadge();
            calculate();
        }
    });

    // Broker selection
    els.brokerSelect.addEventListener('change', () => {
        state.brokerId = els.brokerSelect.value;
        updateBrokerHint();

        // Show/hide custom broker inputs
        if (state.brokerId === 'custom') {
            els.customBrokerGroup.hidden = false;
        } else {
            els.customBrokerGroup.hidden = true;
        }

        calculate();
    });

    // Price input
    els.priceInput.addEventListener('input', debounce(() => {
        const price = parseFloat(els.priceInput.value) || 0;
        state.pricePerShare = price;
        calculate();
    }, 150));

    // Quantity input
    els.quantityInput.addEventListener('input', debounce(() => {
        const qty = parseInt(els.quantityInput.value) || 0;
        state.quantity = Math.max(1, qty);
        calculate();
    }, 150));

    // Quantity buttons
    els.qtyMinus.addEventListener('click', () => {
        const current = parseInt(els.quantityInput.value) || 1;
        const newValue = Math.max(1, current - 1);
        els.quantityInput.value = newValue;
        state.quantity = newValue;
        calculate();
    });

    els.qtyPlus.addEventListener('click', () => {
        const current = parseInt(els.quantityInput.value) || 1;
        const newValue = current + 1;
        els.quantityInput.value = newValue;
        state.quantity = newValue;
        calculate();
    });

    // Custom broker inputs
    els.customRate?.addEventListener('input', debounce(() => {
        const rate = parseFloat(els.customRate.value) || 1.5;
        state.customRate = rate / 100;
        calculate();
    }, 150));

    els.customMinFee?.addEventListener('input', debounce(() => {
        const fee = parseFloat(els.customMinFee.value) || 0;
        state.customMinFee = fee;
        calculate();
    }, 150));

    // Share button
    els.shareBtn?.addEventListener('click', handleShare);
}

// ============================================
// Direction Handling
// ============================================

/**
 * Set trade direction
 * @param {string} direction - 'buy' or 'sell'
 */
function setDirection(direction) {
    state.direction = direction;

    els.directionBtns.forEach(btn => {
        if (btn.dataset.direction === direction) {
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
        } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        }
    });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Debounce function for input handlers
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Update broker hint text
 */
function updateBrokerHint() {
    const broker = data.getBroker(state.brokerId);
    if (broker && els.brokerHint) {
        const ratePct = (broker.brokerageRate * 100).toFixed(2);
        const minFeeText = broker.minFee > 0 ? `, min KES ${broker.minFee}` : '';
        els.brokerHint.textContent = `Rate: ${ratePct}%${minFeeText}`;
    }
}

/**
 * Update price date badge
 */
function updatePriceDateBadge() {
    const stock = data.getStock(state.ticker);
    if (stock && els.priceDateBadge) {
        const date = new Date(stock.priceDate);
        const formatted = date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
        els.priceDateBadge.textContent = `as of ${formatted}`;

        // Check if price is stale (> 7 days)
        const daysOld = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOld > 7) {
            els.priceDateBadge.style.color = 'var(--color-fee-high)';
            els.priceDateBadge.textContent += ' ⚠️';
        }
    }

    // Update footer date
    if (els.priceUpdateDate) {
        const priceDate = data.getPriceDataDate();
        const date = new Date(priceDate);
        els.priceUpdateDate.textContent = date.toLocaleDateString('en-KE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }
}

/**
 * Update URL parameters without reloading
 */
function updateURL() {
    const params = calc.buildURLParams({
        ticker: state.ticker || '',
        quantity: state.quantity,
        brokerId: state.brokerId,
        direction: state.direction
    });

    const url = params ? '?' + params : window.location.pathname;
    window.history.replaceState({}, '', url);
}

// ============================================
// Calculation & Rendering
// ============================================

/**
 * Perform calculation and update UI
 */
function calculate() {
    // Validate inputs
    if (!state.ticker || state.pricePerShare <= 0 || state.quantity <= 0) {
        els.resultsCard.hidden = true;
        els.impactSection.hidden = true;
        els.breakEvenSection.hidden = true;
        els.brokerSection.hidden = true;
        els.emptyState.hidden = false;
        return;
    }

    // Get broker settings
    let brokerageRate, minBrokerageFee;
    if (state.brokerId === 'custom') {
        brokerageRate = state.customRate || 0.015;
        minBrokerageFee = state.customMinFee || 0;
    } else {
        const broker = data.getBroker(state.brokerId);
        brokerageRate = broker?.brokerageRate || 0.015;
        minBrokerageFee = broker?.minFee || 0;
    }

    // Validate
    const validation = calc.validateInputs({
        pricePerShare: state.pricePerShare,
        quantity: state.quantity,
        brokerageRate
    });

    if (!validation.valid) {
        console.warn('Validation errors:', validation.errors);
        return;
    }

    // Calculate trade
    const result = calc.calculateTrade(
        state.direction,
        state.pricePerShare,
        state.quantity,
        brokerageRate,
        minBrokerageFee
    );

    // Hide empty state, show results
    els.emptyState.hidden = true;
    els.resultsCard.hidden = false;

    // Render results
    renderResults(result);
    renderImpactTable();
    renderBreakEven();
    renderBrokerComparison();

    // Update URL
    updateURL();
}

/**
 * Render main results
 * @param {TradeResult} result - Calculation result
 */
function renderResults(result) {
    const stock = data.getStock(state.ticker);
    const feeStatus = calc.getFeeStatus(result.feePercentage);

    // Update hero
    els.resultsLabel.textContent = result.amountLabel;
    els.resultsAmount.textContent = calc.formatKES(result.totalAmount);

    // Update fee percentage and emoji
    els.feePercentValue.textContent = result.feePercentage.toFixed(2);
    els.feeEmoji.textContent = feeStatus.emoji;

    // Update fee thermometer
    const thermometerHeight = Math.min(result.feePercentage, 10) * 10; // Cap at 10% for visual
    els.feeThermometerBar.style.height = `${thermometerHeight}%`;
    els.feeThermometerBar.style.background = feeStatus.color;

    // Update fee amount
    els.feeAmount.textContent = `Fees: ${calc.formatKES(result.totalFees)}`;

    // Stamp duty warning
    const stampDutyPct = (result.stampDuty / result.consideration) * 100;
    if (calc.isStampDutySignificant(result.stampDuty, result.consideration)) {
        els.stampDutyWarning.hidden = false;
        els.stampDutyAmount.textContent = result.stampDuty.toFixed(2);
        els.stampDutyPercent.textContent = stampDutyPct.toFixed(2);
    } else {
        els.stampDutyWarning.hidden = true;
    }

    // Minimum fee warning
    if (result.minFeeApplied) {
        els.minFeeWarning.hidden = false;
        const broker = data.getBroker(state.brokerId);
        const minFee = broker?.minFee || 0;
        els.minFeeWarningText.textContent = `Minimum broker fee of KES ${minFee} applied. Your trade value is below the threshold.`;
    } else {
        els.minFeeWarning.hidden = true;
    }

    // Summary
    const action = state.direction === 'buy' ? 'Buying' : 'Selling';
    els.resultsSummary.textContent = `${action} ${state.quantity} shares of ${state.ticker} at KES ${state.pricePerShare.toFixed(2)} ${state.direction === 'buy' ? 'costs you' : 'you receive'} ${calc.formatKES(result.totalAmount)}. Fees eat ${calc.formatKES(result.totalFees)} (${result.feePercentage.toFixed(2)}%).`;

    // Breakdown table
    els.bdSharesValue.textContent = calc.formatKES(result.consideration);
    els.bdBrokerage.textContent = calc.formatKES(result.brokerage);
    els.bdBrokerageRate.textContent = state.direction === 'buy'
        ? `(${(state.brokerId === 'custom' ? (state.customRate || 0.015) : data.getBroker(state.brokerId)?.brokerageRate || 0.015) * 100}%)`
        : '';
    els.bdVat.textContent = calc.formatKES(result.vatOnBrokerage);
    els.bdNse.textContent = calc.formatKES(result.nseLevy);
    els.bdCma.textContent = calc.formatKES(result.cmaLevy);
    els.bdCdsc.textContent = calc.formatKES(result.cdscFee);
    els.bdIcf.textContent = calc.formatKES(result.icfLevy);
    els.bdStamp.textContent = `KES ${result.stampDuty.toFixed(0)}`;
    els.bdTotalFees.textContent = calc.formatKES(result.totalFees);
    els.bdTotalLabel.textContent = `TOTAL YOU ${state.direction === 'buy' ? 'PAY' : 'RECEIVE'}`;
    els.bdGrandTotal.textContent = calc.formatKES(result.totalAmount);
}

/**
 * Render fee impact comparison table
 */
function renderImpactTable() {
    const stock = data.getStock(state.ticker);
    if (!stock) return;

    // Get broker settings
    let brokerageRate, minBrokerageFee;
    if (state.brokerId === 'custom') {
        brokerageRate = state.customRate || 0.015;
        minBrokerageFee = state.customMinFee || 0;
    } else {
        const broker = data.getBroker(state.brokerId);
        brokerageRate = broker?.brokerageRate || 0.015;
        minBrokerageFee = broker?.minFee || 0;
    }

    const quantities = calc.generateComparisonQuantities(stock.price);
    const impacts = calc.calculateFeeImpact(stock.price, quantities, brokerageRate, minBrokerageFee);
    const sweetSpot = calc.calculateSweetSpot(stock.price);

    // Clear existing rows
    els.impactTableBody.innerHTML = '';

    // Add rows using safe DOM methods
    impacts.forEach(impact => {
        const row = document.createElement('tr');
        const status = calc.getFeeStatus(impact.feePercentage);

        row.appendChild(createCell(impact.quantity.toString()));
        row.appendChild(createCell(calc.formatKES(impact.tradeValue)));
        row.appendChild(createCell(calc.formatKES(impact.totalFees)));
        row.appendChild(createCell(`${status.emoji} ${impact.feePercentage.toFixed(2)}%`));
        els.impactTableBody.appendChild(row);
    });

    // Show section
    els.impactSection.hidden = false;

    // Verdict box - use safe DOM methods
    const verdict = calc.getVerdict(state.quantity, calc.calculateBuy({
        pricePerShare: stock.price,
        quantity: state.quantity,
        brokerageRate,
        minBrokerageFee
    }).feePercentage, sweetSpot);

    els.verdictBox.innerHTML = '';
    const verdictDiv1 = createElement('div', 'verdict-entry');
    verdictDiv1.style.marginBottom = '0.5rem';
    verdictDiv1.appendChild(createElement('span', '', verdict.emoji));
    verdictDiv1.appendChild(createElement('span', '', ''));
    verdictDiv1.lastChild.textContent = ` ${verdict.class === 'optimal' ? 'Sweet spot:' : 'Verdict:'} ${verdict.message}`;

    const verdictDiv2 = createElement('div', 'verdict-entry');
    verdictDiv2.style.fontSize = '0.8rem';
    verdictDiv2.style.opacity = '0.8';
    verdictDiv2.appendChild(createElement('span', '', '💡'));
    verdictDiv2.appendChild(createElement('span', '', ''));
    verdictDiv2.lastChild.textContent = ` Sweet spot: ${sweetSpot} shares (${calc.formatKES(sweetSpot * stock.price)})`;

    els.verdictBox.appendChild(verdictDiv1);
    els.verdictBox.appendChild(verdictDiv2);
}

/**
 * Render break-even analysis
 */
function renderBreakEven() {
    const stock = data.getStock(state.ticker);
    if (!stock) return;

    // Get broker settings
    let brokerageRate, minBrokerageFee;
    if (state.brokerId === 'custom') {
        brokerageRate = state.customRate || 0.015;
        minBrokerageFee = state.customMinFee || 0;
    } else {
        const broker = data.getBroker(state.brokerId);
        brokerageRate = broker?.brokerageRate || 0.015;
        minBrokerageFee = broker?.minFee || 0;
    }

    const breakEven = calc.calculateBreakEven(stock.price, state.quantity, brokerageRate, minBrokerageFee);

    els.breakEvenMain.textContent = `${state.ticker} needs to reach ${calc.formatKES(breakEven.breakEvenPrice)} (+${breakEven.breakEvenPct.toFixed(2)}%) before you break even.`;
    els.breakEvenSub.textContent = `The stock must rise ${breakEven.breakEvenPct.toFixed(2)}% before you make even one shilling in profit. If it only rises ${(breakEven.breakEvenPct * 0.5).toFixed(2)}%, you are still losing money.`;

    els.breakEvenSection.hidden = false;
}

/**
 * Render broker comparison table
 */
function renderBrokerComparison() {
    const stock = data.getStock(state.ticker);
    if (!stock) return;

    const brokers = data.getAllBrokers().filter(b => b.id !== 'custom');
    const comparison = calc.compareBrokers(stock.price, state.quantity, brokers);

    // Clear existing rows
    els.brokerTableBody.innerHTML = '';

    // Add rows using safe DOM methods
    comparison.forEach((comp, index) => {
        const row = document.createElement('tr');
        const status = calc.getFeeStatus(comp.feePercentage);
        const bestBadge = index === 0 ? ' ⭐' : '';

        row.appendChild(createCell(comp.brokerName + bestBadge));
        row.appendChild(createCell(`${(comp.brokerageRate * 100).toFixed(2)}%`));
        row.appendChild(createCell(calc.formatKES(comp.totalFees)));
        row.appendChild(createCell(`${status.emoji} ${comp.feePercentage.toFixed(2)}%`));
        els.brokerTableBody.appendChild(row);
    });

    els.brokerSection.hidden = false;
}

// ============================================
// Share Handler
// ============================================

/**
 * Handle share button click
 */
async function handleShare() {
    const stock = data.getStock(state.ticker);
    if (!stock) return;

    // Get broker settings
    let brokerageRate, minBrokerageFee;
    if (state.brokerId === 'custom') {
        brokerageRate = state.customRate || 0.015;
        minBrokerageFee = state.customMinFee || 0;
    } else {
        const broker = data.getBroker(state.brokerId);
        brokerageRate = broker?.brokerageRate || 0.015;
        minBrokerageFee = broker?.minFee || 0;
    }

    const result = calc.calculateTrade(
        state.direction,
        state.pricePerShare,
        state.quantity,
        brokerageRate,
        minBrokerageFee
    );

    const breakEven = calc.calculateBreakEven(stock.price, state.quantity, brokerageRate, minBrokerageFee);
    const feeStatus = calc.getFeeStatus(result.feePercentage);

    await shareResult({
        ticker: stock.ticker,
        stockName: stock.name,
        direction: state.direction,
        pricePerShare: stock.price,
        quantity: state.quantity,
        totalAmount: result.totalAmount,
        amountLabel: result.amountLabel,
        totalFees: result.totalFees,
        feePercentage: result.feePercentage,
        stampDuty: result.stampDuty,
        breakEvenPrice: breakEven.breakEvenPrice,
        breakEvenPct: breakEven.breakEvenPct,
        feeEmoji: feeStatus.emoji
    });
}

// ============================================
// Service Worker Registration
// ============================================

/**
 * Register service worker for PWA functionality
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => {
                console.log('Service worker registered:', reg);
            })
            .catch(err => {
                console.log('Service worker registration failed:', err);
            });
    }
}

// ============================================
// Initialize on DOM Ready
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Type definitions for JSDoc

/**
 * @typedef {Object} CalculatorState
 * @property {string} direction - 'buy' or 'sell'
 * @property {string|null} ticker - Stock ticker symbol
 * @property {string} brokerId - Broker ID
 * @property {number} pricePerShare - Price per share in KES
 * @property {number} quantity - Number of shares
 * @property {number|null} customRate - Custom broker rate (if custom broker)
 * @property {number} customMinFee - Custom minimum fee (if custom broker)
 */
