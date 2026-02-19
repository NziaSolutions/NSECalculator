/**
 * NSE Fee Calculator — UI Module (Neo-Fintech Design)
 *
 * Handles all DOM manipulation, event listeners, and rendering.
 * Uses calculator.js for all calculations (pure functions).
 *
 * @module ui
 */

import * as calc from './calculator.js';
import * as data from './data.js';
import { shareResult } from './share.js';

// ============================================
// Utility Functions
// ============================================

/**
 * Create a table cell with text content
 */
function createCell(text) {
    const cell = document.createElement('td');
    cell.textContent = text;
    return cell;
}

/**
 * Create an element with class and text content
 */
function createElement(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
}

/**
 * Animate number counting
 */
function animateNumber(element, endValue, duration = 600, prefix = '', suffix = '') {
    const startTime = performance.now();
    const startValue = parseFloat(element.textContent.replace(/[^\d.-]/g, '')) || 0;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);

        const currentValue = startValue + (endValue - startValue) * easeOut;
        element.textContent = prefix + currentValue.toFixed(2) + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ============================================
// State
// ============================================

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

const els = {
    // Direction
    directionSwitch: document.querySelector('.direction-switch'),
    directionBtns: document.querySelectorAll('.dir-btn'),

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
    feeBarFill: document.getElementById('feeBarFill'),
    feePercentValue: document.getElementById('feePercentValue'),
    feeEmoji: document.getElementById('feeEmoji'),
    feeBadge: document.getElementById('feeBadge'),
    feeAmount: document.getElementById('feeAmount'),
    stampDutyAlert: document.getElementById('stampDutyAlert'),
    stampDutyAmount: document.getElementById('stampDutyAmount'),
    stampDutyPercent: document.getElementById('stampDutyPercent'),
    resultsSummary: document.getElementById('resultsSummary'),

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

    // Share
    shareBtn: document.getElementById('shareBtn'),
    priceUpdateDate: document.getElementById('priceUpdateDate'),
    brokerCountValue: document.getElementById('brokerCountValue'),
    
    // Stats
    statBrokerCount: document.getElementById('statBrokerCount'),
    statStockCount: document.getElementById('statStockCount')
};

// ============================================
// Initialization
// ============================================

async function init() {
    // Fetch fresh prices from data/stocks.json
    await data.loadPrices();

    populateStocks();
    populateBrokers();
    loadURLParams();
    attachEventListeners();
    updatePriceDateBadge();
    updateBrokerCount();

    // Hide loading
    els.loadingState.hidden = true;

    // Register service worker
    registerServiceWorker();
}

/**
 * Update hero broker count
 */
function updateBrokerCount() {
    const brokerCount = data.getAllBrokers().filter(broker => broker.id !== 'custom').length;
    const stockCount = data.getAllStocks().length;
    
    if (els.brokerCountValue) {
        els.brokerCountValue.textContent = `${brokerCount} compared`;
    }
    
    if (els.statBrokerCount) {
        els.statBrokerCount.textContent = `${brokerCount}+`;
    }
    
    if (els.statStockCount) {
        els.statStockCount.textContent = `${stockCount}+`;
    }
}

/**
 * Populate stock dropdown
 */
function populateStocks() {
    const stocks = data.getAllStocks();
    const popularGroup = document.createElement('optgroup');
    popularGroup.label = 'Popular Stocks';
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

/**
 * Set trade direction
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

    // Update slider
    if (direction === 'sell') {
        els.directionSwitch?.setAttribute('data-sell', 'true');
    } else {
        els.directionSwitch?.removeAttribute('data-sell');
    }
}

/**
 * Debounce function
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

        const daysOld = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOld > 7) {
            els.priceDateBadge.style.color = 'var(--warning)';
        } else {
            els.priceDateBadge.style.color = '';
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
 * Update URL parameters
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
    if (!state.ticker || state.pricePerShare <= 0 || state.quantity <= 0) {
        els.resultsCard.hidden = true;
        els.impactSection.hidden = true;
        els.breakEvenSection.hidden = true;
        els.brokerSection.hidden = true;
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

    const validation = calc.validateInputs({
        pricePerShare: state.pricePerShare,
        quantity: state.quantity,
        brokerageRate
    });

    if (!validation.valid) {
        console.warn('Validation errors:', validation.errors);
        return;
    }

    const result = calc.calculateTrade(
        state.direction,
        state.pricePerShare,
        state.quantity,
        brokerageRate,
        minBrokerageFee
    );

    els.resultsCard.hidden = false;

    renderResults(result);
    renderImpactTable();
    renderBreakEven();
    renderBrokerComparison();

    updateURL();
}

/**
 * Render main results with animations
 */
function renderResults(result) {
    const stock = data.getStock(state.ticker);
    const feeStatus = calc.getFeeStatus(result.feePercentage);

    // Update hero with animation
    els.resultsLabel.textContent = result.amountLabel;

    // Animate the main amount
    animateNumber(els.resultsAmount, result.totalAmount, 800, 'KES ', '');

    // Update fee percentage and badge
    els.feePercentValue.textContent = result.feePercentage.toFixed(2);
    els.feeEmoji.textContent = feeStatus.emoji;

    // Update fee badge class
    els.feeBadge.className = 'fee-badge fee-' + feeStatus.class;

    // Update fee bar with animation
    const barWidth = Math.min(result.feePercentage / 5, 1) * 100;
    els.feeBarFill.style.width = `${barWidth}%`;
    els.feeBarFill.className = `fee-bar-fill fee-${feeStatus.class}`;
    els.feeBarFill.parentElement.style.setProperty('--fill-width', `${barWidth}%`);

    // Update fee amount
    els.feeAmount.textContent = calc.formatKES(result.totalFees);

    // Stamp duty alert
    const stampDutyPct = (result.stampDuty / result.consideration) * 100;
    if (calc.isStampDutySignificant(result.stampDuty, result.consideration)) {
        els.stampDutyAlert.hidden = false;
        els.stampDutyAmount.textContent = result.stampDuty.toFixed(2);
        els.stampDutyPercent.textContent = stampDutyPct.toFixed(2);
    } else {
        els.stampDutyAlert.hidden = true;
    }

    // Summary
    const action = state.direction === 'buy' ? 'Buying' : 'Selling';
    els.resultsSummary.textContent = `${action} ${state.quantity} ${state.ticker} @ KES ${state.pricePerShare.toFixed(2)} = ${calc.formatKES(result.totalAmount)}`;

    // Breakdown
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

    els.impactTableBody.innerHTML = '';

    impacts.forEach(impact => {
        const row = document.createElement('tr');
        const status = calc.getFeeStatus(impact.feePercentage);

        row.appendChild(createCell(impact.quantity.toString()));
        row.appendChild(createCell(calc.formatKES(impact.tradeValue)));
        row.appendChild(createCell(calc.formatKES(impact.totalFees)));

        const feeCell = createCell(`${status.emoji} ${impact.feePercentage.toFixed(2)}%`);
        row.appendChild(feeCell);

        els.impactTableBody.appendChild(row);
    });

    els.impactSection.hidden = false;

    // Verdict
    const verdict = calc.getVerdict(state.quantity, calc.calculateBuy({
        pricePerShare: stock.price,
        quantity: state.quantity,
        brokerageRate,
        minBrokerageFee
    }).feePercentage, sweetSpot);

    els.verdictBox.innerHTML = '';
    els.verdictBox.className = `verdict-card verdict-card--${verdict.class}`;

    const verdictKicker = document.createElement('p');
    verdictKicker.className = 'verdict-kicker';
    verdictKicker.textContent = `${verdict.emoji} Fee guidance`;

    const verdictTitle = document.createElement('p');
    verdictTitle.className = 'verdict-title';
    verdictTitle.textContent = verdict.title;

    const verdictP = document.createElement('p');
    verdictP.className = 'verdict-message';
    verdictP.textContent = verdict.message;

    els.verdictBox.appendChild(verdictKicker);
    els.verdictBox.appendChild(verdictTitle);
    els.verdictBox.appendChild(verdictP);

    if (verdict.sharesToSweetSpot > 0 && verdict.actionLabel) {
        const quickAction = document.createElement('button');
        quickAction.type = 'button';
        quickAction.className = 'verdict-action';
        quickAction.textContent = verdict.actionLabel;
        quickAction.addEventListener('click', () => {
            state.quantity = verdict.sweetSpot;
            els.quantityInput.value = verdict.sweetSpot;
            calculate();
        });
        els.verdictBox.appendChild(quickAction);
    }
}

/**
 * Render break-even analysis
 */
function renderBreakEven() {
    const stock = data.getStock(state.ticker);
    if (!stock) return;

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

    els.breakEvenMain.textContent = `${state.ticker} must reach ${calc.formatKES(breakEven.breakEvenPrice)} (+${breakEven.breakEvenPct.toFixed(2)}%) to break even.`;
    els.breakEvenSub.textContent = `The stock needs to rise ${breakEven.breakEvenPct.toFixed(2)}% before you make any profit.`;

    els.breakEvenSection.hidden = false;
}

/**
 * Render broker comparison
 */
function renderBrokerComparison() {
    const stock = data.getStock(state.ticker);
    if (!stock) return;

    const brokers = data.getAllBrokers().filter(b => b.id !== 'custom');
    const comparison = calc.compareBrokers(stock.price, state.quantity, brokers);

    els.brokerTableBody.innerHTML = '';

    comparison.forEach((comp, index) => {
        const card = document.createElement('div');
        const status = calc.getFeeStatus(comp.feePercentage);
        const bestClass = index === 0 ? 'best' : '';

        card.className = `broker-item ${bestClass}`;
        card.innerHTML = `
            <div class="broker-name">${comp.brokerName}</div>
            <div class="broker-rate">${(comp.brokerageRate * 100).toFixed(2)}%</div>
            <div class="broker-fee">${calc.formatKES(comp.totalFees)}</div>
            <div class="broker-meta">${status.emoji} ${comp.feePercentage.toFixed(2)}%</div>
        `;
        els.brokerTableBody.appendChild(card);
    });

    els.brokerSection.hidden = false;
}

/**
 * Handle share button click
 */
async function handleShare() {
    const stock = data.getStock(state.ticker);
    if (!stock) return;

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

/**
 * Register service worker
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service worker registered:', reg))
            .catch(err => console.log('Service worker registration failed:', err));
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
