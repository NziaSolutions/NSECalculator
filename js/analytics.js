/**
 * Umami Analytics — Privacy-friendly event tracking
 * 
 * All events are sent to the Umami instance on Coolify.
 * No PII is captured, no cookies are stored.
 * 
 * @module analytics
 */

/**
 * Track a custom event
 * @param {string} eventName - Event name (e.g., 'calculation_completed')
 * @param {Object} eventData - Optional data object (key-value pairs)
 */
export function trackEvent(eventName, eventData = {}) {
  if (typeof window.umami !== 'undefined') {
    window.umami.track(eventName, eventData);
  }
}

/**
 * Track when a calculation is completed
 * @param {string} ticker - Stock ticker (e.g., 'SCOM')
 * @param {number} quantity - Quantity traded
 * @param {string} broker - Broker name
 * @param {string} direction - 'buy' or 'sell'
 * @param {number} feePercentage - Total fees as percentage
 */
export function trackCalculation(ticker, quantity, broker, direction, feePercentage) {
  trackEvent('calculation_completed', {
    ticker,
    quantity: String(quantity),
    broker,
    direction,
    feePercentage: feePercentage.toFixed(2),
  });
}

/**
 * Track stock selection
 * @param {string} ticker - Stock ticker
 */
export function trackStockSelected(ticker) {
  trackEvent('stock_selected', {
    ticker,
  });
}

/**
 * Track broker comparison view
 * @param {string} selectedBroker - Selected broker name
 */
export function trackBrokerComparison(selectedBroker) {
  trackEvent('broker_compared', {
    broker: selectedBroker,
  });
}

/**
 * Track share card generation
 * @param {string} method - Share method: 'web_share', 'copy_link', or 'html2canvas'
 */
export function trackShareAttempt(method) {
  trackEvent('share_attempted', {
    shareMethod: method,
  });
}

/**
 * Track PWA installation
 */
export function trackPWAInstalled() {
  trackEvent('pwa_installed');
}

/**
 * Track break-even calculation view
 */
export function trackBreakEvenView() {
  trackEvent('breakeven_viewed');
}

/**
 * Track theme toggle
 * @param {string} theme - 'light', 'dark', or 'auto'
 */
export function trackThemeToggle(theme) {
  trackEvent('theme_toggled', {
    theme,
  });
}
