/**
 * NSE Fee Calculator — Data Module
 *
 * Contains all stock data, fee configuration, and broker information.
 * Prices are as of February 2026 and should be updated periodically.
 *
 * @module data
 */

// ============================================
// Stock Data (NSE Listed Equities)
// ============================================

/** All NSE-listed stocks with prices and metadata */
const STOCKS = [
    // Banking
    { ticker: 'ABSA', name: 'Absa Bank Kenya PLC', sector: 'Banking', price: 30.20, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'BKG', name: 'BK Group PLC', sector: 'Banking', price: 42.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'DTB', name: 'Diamond Trust Bank Kenya PLC', sector: 'Banking', price: 98.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'EQTY', name: 'Equity Group Holdings PLC', sector: 'Banking', price: 74.75, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'HF', name: 'HF Group PLC', sector: 'Banking', price: 5.80, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'KCB', name: 'KCB Group PLC', sector: 'Banking', price: 75.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'NCBA', name: 'NCBA Group PLC', sector: 'Banking', price: 44.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'SBIC', name: 'Stanbic Holdings PLC', sector: 'Banking', price: 112.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'SCBK', name: 'Standard Chartered Bank Kenya PLC', sector: 'Banking', price: 155.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'COOP', name: 'Co-operative Bank of Kenya PLC', sector: 'Banking', price: 16.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },

    // Insurance
    { ticker: 'BRIT', name: 'Britam Holdings PLC', sector: 'Insurance', price: 31.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'CIC', name: 'CIC Insurance Group PLC', sector: 'Insurance', price: 3.95, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'JUB', name: 'Jubilee Holdings PLC', sector: 'Insurance', price: 480.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'KRE', name: 'Kenya Reinsurance Corporation PLC', sector: 'Insurance', price: 2.85, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'SLAM', name: 'Sanlam Kenya PLC', sector: 'Insurance', price: 12.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'LBTY', name: 'Liberty Kenya Holdings PLC', sector: 'Insurance', price: 315.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },

    // Telecommunications
    { ticker: 'SCOM', name: 'Safaricom PLC', sector: 'Telecommunications', price: 33.85, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },

    // Manufacturing
    { ticker: 'BAT', name: 'BAT Kenya PLC', sector: 'Manufacturing', price: 520.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'CARB', name: 'Carbacid Investments PLC', sector: 'Manufacturing', price: 8.75, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'EABL', name: 'East African Breweries PLC', sector: 'Manufacturing', price: 185.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'FTGH', name: 'Flame Tree Group Holdings PLC', sector: 'Manufacturing', price: 4.20, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'BOC', name: 'BOC Kenya PLC', sector: 'Manufacturing', price: 85.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'EVRD', name: 'Eveready East Africa PLC', sector: 'Manufacturing', price: 2.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'UNGA', name: 'Unga Group PLC', sector: 'Manufacturing', price: 18.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },

    // Energy
    { ticker: 'KEGN', name: 'KenGen PLC', sector: 'Energy', price: 8.75, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'KPLC', name: 'Kenya Power & Lighting Co PLC', sector: 'Energy', price: 3.45, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'TOTL', name: 'TotalEnergies Marketing Kenya PLC', sector: 'Energy', price: 28.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'UMME', name: 'Umeme Ltd', sector: 'Energy', price: 7.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },

    // Construction
    { ticker: 'ARM', name: 'ARM Cement PLC', sector: 'Construction', price: 5.20, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'BAMB', name: 'Bamburi Cement PLC', sector: 'Construction', price: 52.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'CABL', name: 'EA Cables Ltd', sector: 'Construction', price: 4.80, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'PORT', name: 'East African Portland Cement PLC', sector: 'Construction', price: 6.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },

    // Agriculture
    { ticker: 'EGAD', name: 'Eaagads Ltd', sector: 'Agriculture', price: 8.20, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'KAPC', name: 'Kapchorua Tea Kenya PLC', sector: 'Agriculture', price: 145.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'SASN', name: 'Sasini PLC', sector: 'Agriculture', price: 24.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'WTK', name: 'Williamson Tea Kenya PLC', sector: 'Agriculture', price: 285.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'KUKZ', name: 'Kakuzi PLC', sector: 'Agriculture', price: 315.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'LMR', name: 'Limuru Tea Co PLC', sector: 'Agriculture', price: 420.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'MSC', name: 'Mumias Sugar Co PLC', sector: 'Agriculture', price: 0.85, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },

    // Commercial & Services
    { ticker: 'DCON', name: 'Deacons (East Africa) PLC', sector: 'Commercial', price: 3.20, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'KQ', name: 'Kenya Airways PLC', sector: 'Commercial', price: 9.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'NMG', name: 'Nation Media Group PLC', sector: 'Commercial', price: 32.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'SMIL', name: 'Sameer Africa PLC', sector: 'Automobiles', price: 3.80, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'STRS', name: 'Standard Group PLC', sector: 'Commercial', price: 28.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'SCAN', name: 'ScanGroup PLC', sector: 'Commercial', price: 68.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'HMBZ', name: 'Homeboyz Entertainment PLC', sector: 'Commercial', price: 5.25, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'SNNA', name: 'Serena Hotels', sector: 'Commercial', price: 42.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'LNGH', name: 'Longhorn Publishers PLC', sector: 'Commercial', price: 5.80, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'LTPT', name: 'Laptrust', sector: 'Commercial', price: 3.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'UCHM', name: 'Uchumi Supermarkets PLC', sector: 'Commercial', price: 2.10, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },

    // Investment
    { ticker: 'CTUM', name: 'Centum Investment Company PLC', sector: 'Investment', price: 42.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'HAFR', name: 'Home Afrika PLC', sector: 'Investment', price: 1.85, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'OLYM', name: 'Olympia Capital Holdings PLC', sector: 'Investment', price: 12.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'TCL', name: 'Transcentury PLC', sector: 'Investment', price: 1.25, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'KURW', name: 'Kurwitu Ventures PLC', sector: 'Investment', price: 3.80, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },
    { ticker: 'NSE', name: 'Nairobi Securities Exchange PLC', sector: 'Investment Services', price: 18.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },

    // Automobiles
    { ticker: 'CG', name: 'Car & General (K) PLC', sector: 'Automobiles', price: 185.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },

    // REIT
    { ticker: 'FAHR', name: 'ILAM Fahari I-REIT', sector: 'REIT', price: 8.50, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },

    // ETF
    { ticker: 'NGOLDETF', name: 'NewGold Issuer Ltd', sector: 'ETF', price: 2850.00, priceDate: '2026-02-18', market: 'MIMS', isSuspended: false },

    // Alternative Investment Market (AIMS)
    { ticker: 'AMSC', name: 'Afri Mega Agricorp PLC', sector: 'Agriculture', price: 4.50, priceDate: '2026-02-18', market: 'AIMS', isSuspended: false },

    // Growth Enterprise Market (GEMS)
    { ticker: 'NBV', name: 'Nairobi Business Ventures Ltd', sector: 'Commercial', price: 3.20, priceDate: '2026-02-18', market: 'GEMS', isSuspended: false }
];

// Popular stocks (shown first in dropdown)
const POPULAR_STOCKS = ['SCOM', 'EQTY', 'KCB', 'ABSA', 'COOP', 'EABL', 'KQ'];

/** Stock data lookup map */
const STOCK_MAP = new Map(STOCKS.map(s => [s.ticker, s]));

// ============================================
// Fee Configuration
// ============================================

/**
 * Fee rates and configuration for NSE trading
 * Source: CMA Gazette, NSE website, broker fee schedules
 */
const FEE_CONFIG = {
    brokerage: {
        defaultRate: 0.0112,  // 1.12% traditional broker default
        minFee: 0,
        description: 'Stockbroker commission'
    },
    vatOnBrokerage: {
        rate: 0.16,  // 16%
        description: 'VAT charged on brokerage commission only'
    },
    nseLevy: {
        rate: 0.0012,  // 0.12%
        description: 'NSE transaction levy'
    },
    cmaLevy: {
        rate: 0.0008,  // 0.08%
        description: 'Capital Markets Authority levy'
    },
    cdscFee: {
        rate: 0.0008,  // 0.08% confirmed per cdsc.co.ke Oct 2025
        description: 'Central Depository & Settlement Corporation fee'
    },
    icfLevy: {
        rate: 0.0001,  // 0.01%
        description: 'Investor Compensation Fund levy'
    },
    stampDuty: {
        ratePerBracket: 2,  // KES 2
        bracketSize: 10000,  // per KES 10,000
        description: 'KES 2 per every KES 10,000 or part thereof'
    },
    lastUpdated: '2026-02-19',
    source: 'CMA Gazette / NSE Fee Schedule'
};

// ============================================
// Broker Data
// ============================================

/**
 * Kenyan stockbroker configurations
 * Rates are negotiable — these are standard retail rates
 */
const BROKERS = [
    {
        id: 'ziidi',
        name: 'Safaricom Ziidi (Kestrel Capital)',
        brokerageRate: 0.0150,  // 1.50%
        minFee: 0,
        platform: 'Mobile App',
        cdsType: 'Omnibus',
        notes: 'Single-share trading. No minimum lot. No minimum fee. Brokerage is 1.50% (not 1.12%). Ziidi markets "~1.5% all-in" which refers to brokerage only — statutory levies are on top.'
    },
    {
        id: 'sib',
        name: 'Standard Investment Bank (SIB)',
        brokerageRate: 0.0100,  // 1.00%
        minFee: 0,
        platform: 'Mobile App / Web',
        cdsType: 'Individual',
        notes: 'Lower commission. Individual CDS account.'
    },
    {
        id: 'dyer',
        name: 'Dyer & Blair',
        brokerageRate: 0.0120,  // 1.20%
        minFee: 0,
        platform: 'Web / In-person',
        cdsType: 'Individual',
        notes: 'Established broker with full-service offering.'
    },
    {
        id: 'faida',
        name: 'Faida Investment Bank',
        brokerageRate: 0.0125,  // 1.25%
        minFee: 100,  // KES 100 minimum
        platform: 'Web / In-person',
        cdsType: 'Individual',
        notes: 'Traditional broker with KES 100 minimum fee. Individual CDS account.'
    },
    {
        id: 'efg',
        name: 'EFG Hermes Kenya',
        brokerageRate: 0.0150,  // 1.50%
        minFee: 0,
        platform: 'Web / Mobile',
        cdsType: 'Individual',
        notes: 'International broker with Kenya presence.'
    },
    {
        id: 'custom',
        name: 'Other / Custom',
        brokerageRate: 0.0150,  // Default to 1.50%
        minFee: 0,
        platform: 'Various',
        cdsType: 'Various',
        notes: 'Enter your broker specific rates manually.'
    }
];

/** Broker data lookup map */
const BROKER_MAP = new Map(BROKERS.map(b => [b.id, b]));

/** Default broker ID (Ziidi — primary target users) */
const DEFAULT_BROKER_ID = 'ziidi';

// ============================================
// Export Functions
// ============================================

/**
 * Get all stocks sorted by popularity then name
 * @returns {Stock[]} Array of stock objects
 */
function getAllStocks() {
    const popular = STOCKS.filter(s => POPULAR_STOCKS.includes(s.ticker));
    const others = STOCKS.filter(s => !POPULAR_STOCKS.includes(s.ticker))
        .sort((a, b) => a.ticker.localeCompare(b.ticker));
    return [...popular, ...others];
}

/**
 * Get stock by ticker symbol
 * @param {string} ticker - Stock ticker symbol
 * @returns {Stock|undefined} Stock object or undefined
 */
function getStock(ticker) {
    return STOCK_MAP.get(ticker?.toUpperCase());
}

/**
 * Search stocks by ticker or name
 * @param {string} query - Search query
 * @returns {Stock[]} Matching stocks
 */
function searchStocks(query) {
    const q = query?.toLowerCase() || '';
    if (!q) return getAllStocks();
    return STOCKS.filter(s =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q)
    );
}

/**
 * Get all brokers
 * @returns {Broker[]} Array of broker objects
 */
function getAllBrokers() {
    return BROKERS;
}

/**
 * Get broker by ID
 * @param {string} id - Broker ID
 * @returns {Broker|undefined} Broker object or undefined
 */
function getBroker(id) {
    return BROKER_MAP.get(id);
}

/**
 * Get default broker
 * @returns {Broker} Default broker object
 */
function getDefaultBroker() {
    return getBroker(DEFAULT_BROKER_ID);
}

/**
 * Get fee configuration
 * @returns {FeeConfig} Fee configuration object
 */
function getFeeConfig() {
    return FEE_CONFIG;
}

/**
 * Get price data date for display
 * @returns {string} ISO date string of most recent price data
 */
function getPriceDataDate() {
    // Find the most recent price date
    const dates = STOCKS.map(s => s.priceDate).filter(Boolean);
    return dates.sort().reverse()[0] || '2026-02-18';
}

/**
 * Fetch latest prices from data/stocks.json and overlay them onto STOCKS.
 * Falls back silently to embedded prices if the fetch fails (e.g. offline).
 * @returns {Promise<void>}
 */
async function loadPrices() {
    try {
        const res = await fetch('data/stocks.json');
        if (!res.ok) return;
        const json = await res.json();
        const map = {};
        for (const s of json.stocks ?? []) {
            if (s.ticker) map[s.ticker] = s;
        }
        for (const stock of STOCKS) {
            const fresh = map[stock.ticker];
            if (fresh?.price != null) {
                stock.price     = fresh.price;
                stock.priceDate = fresh.priceDate ?? stock.priceDate;
            }
        }
    } catch {
        // Offline or fetch failed — continue with embedded prices
    }
}

// ============================================
// Export
// ============================================

export {
    // Data
    STOCKS,
    BROKERS,
    FEE_CONFIG,
    POPULAR_STOCKS,
    DEFAULT_BROKER_ID,

    // Stock functions
    getAllStocks,
    getStock,
    searchStocks,

    // Broker functions
    getAllBrokers,
    getBroker,
    getDefaultBroker,

    // Config functions
    getFeeConfig,
    getPriceDataDate,
    loadPrices
};

// Type definitions for JSDoc

/**
 * @typedef {Object} Stock
 * @property {string} ticker - Ticker symbol (e.g., "SCOM")
 * @property {string} name - Full company name
 * @property {string} sector - Industry sector
 * @property {number} price - Last closing price in KES
 * @property {string} priceDate - ISO date of price (YYYY-MM-DD)
 * @property {string} market - Market segment (MIMS, AIMS, GEMS, etc.)
 * @property {boolean} isSuspended - Whether trading is suspended
 */

/**
 * @typedef {Object} Broker
 * @property {string} id - Unique broker ID
 * @property {string} name - Broker name
 * @property {number} brokerageRate - Brokerage rate as decimal (e.g., 0.015 for 1.5%)
 * @property {number} minFee - Minimum fee in KES
 * @property {string} platform - Platform type
 * @property {string} cdsType - CDS account type
 * @property {string} notes - Additional notes
 */

/**
 * @typedef {Object} FeeConfig
 * @property {Object} brokerage - Brokerage configuration
 * @property {Object} vatOnBrokerage - VAT configuration
 * @property {Object} nseLevy - NSE levy configuration
 * @property {Object} cmaLevy - CMA levy configuration
 * @property {Object} cdscFee - CDSC fee configuration
 * @property {Object} icfLevy - ICF levy configuration
 * @property {Object} stampDuty - Stamp duty configuration
 * @property {string} lastUpdated - Last update date
 * @property {string} source - Data source
 */
