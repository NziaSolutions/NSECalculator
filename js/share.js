/**
 * NSE Fee Calculator — Share Module
 *
 * Handles shareable result card generation using html2canvas.
 * The library is lazy-loaded only when the user taps Share.
 *
 * @module share
 */

// Hidden share card elements
const shareEls = {
    container: document.getElementById('shareCardHidden'),
    inner: document.querySelector('.share-card-inner'),
    trade: document.getElementById('shareTrade'),
    label: document.getElementById('shareLabel'),
    amount: document.getElementById('shareAmount'),
    fee: document.getElementById('shareFee'),
    emoji: document.getElementById('shareEmoji'),
    stamp: document.getElementById('shareStamp'),
    breakEven: document.getElementById('shareBreakEven')
};

/**
 * Share data interface
 * @typedef {Object} ShareData
 * @property {string} ticker - Stock ticker
 * @property {string} stockName - Full stock name
 * @property {string} direction - 'buy' or 'sell'
 * @property {number} pricePerShare - Price per share
 * @property {number} quantity - Number of shares
 * @property {number} totalAmount - Total amount
 * @property {string} amountLabel - 'YOU PAY' or 'YOU RECEIVE'
 * @property {number} totalFees - Total fees
 * @property {number} feePercentage - Fee percentage
 * @property {number} stampDuty - Stamp duty amount
 * @property {number} breakEvenPrice - Break-even price
 * @property {number} breakEvenPct - Break-even percentage
 * @property {string} feeEmoji - Fee status emoji
 */

/**
 * Format currency for share card
 * @param {number} num - Number to format
 * @returns {string} Formatted string
 */
function formatCurrency(num) {
    const rounded = Math.round(num * 100) / 100;
    return 'KES ' + rounded.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Generate share card with current calculation results
 * @param {ShareData} data - Share data
 * @returns {Promise<Blob|null>} Image blob or null if failed
 */
export async function generateShareCard(data) {
    // Update share card content using textContent
    if (shareEls.trade) {
        const action = data.direction === 'buy' ? 'Buying' : 'Selling';
        shareEls.trade.textContent = `${action} ${data.quantity} ${data.ticker} @ KES ${data.pricePerShare.toFixed(2)}`;
    }
    if (shareEls.label) {
        shareEls.label.textContent = data.amountLabel;
    }
    if (shareEls.amount) {
        shareEls.amount.textContent = formatCurrency(data.totalAmount);
    }
    if (shareEls.fee) {
        const feeText = `${formatCurrency(data.totalFees)} (${data.feePercentage.toFixed(2)}%)`;
        shareEls.fee.textContent = `Fees: ${feeText} ${data.feeEmoji}`;
    }
    if (shareEls.stamp) {
        shareEls.stamp.textContent = formatCurrency(data.stampDuty);
    }
    if (shareEls.breakEven) {
        shareEls.breakEven.textContent = `KES ${data.breakEvenPrice.toFixed(2)} (+${data.breakEvenPct.toFixed(2)}%)`;
    }

    // Make card visible for capture
    if (shareEls.container) {
        shareEls.container.style.position = 'absolute';
        shareEls.container.style.left = '0';
        shareEls.container.style.top = '0';
    }

    try {
        // Lazy load html2canvas
        const html2canvasModule = await import(
            'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
        );
        const html2canvas = html2canvasModule.default;

        // Capture the card
        const canvas = await html2canvas(shareEls.inner, {
            scale: 2, // Retina quality
            backgroundColor: null,
            logging: false,
            useCORS: true
        });

        // Convert to blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png');
        });

        return blob;
    } catch (error) {
        console.error('Failed to generate share card:', error);
        return null;
    } finally {
        // Hide card again
        if (shareEls.container) {
            shareEls.container.style.position = 'fixed';
            shareEls.container.style.left = '-9999px';
            shareEls.container.style.top = '0';
        }
    }
}

/**
 * Generate share text for social media
 * @param {ShareData} data - Share data
 * @returns {string} Share text
 */
function generateShareText(data) {
    const url = window.location.href;
    const highFees = data.feePercentage > 5;

    if (highFees) {
        return `😱 Buying ${data.quantity} ${data.ticker} share${data.quantity > 1 ? 's' : ''} on NSE costs ${data.feePercentage.toFixed(2)}% in fees! Check yours 👇 ${url}`;
    }

    return `I just checked my NSE trade cost. Fees: ${data.feePercentage.toFixed(2)}%. Check yours 👇 ${url}`;
}

/**
 * Share result via Web Share API or copy link
 * @param {ShareData} data - Share data
 */
export async function shareResult(data) {
    const shareText = generateShareText(data);
    const shareUrl = window.location.href;

    // Try Web Share API with image
    if (navigator.share) {
        try {
            // Generate image card
            const imageBlob = await generateShareCard(data);

            if (imageBlob && navigator.canShare) {
                const file = new File([imageBlob], 'nse-fee-calculator.png', { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: 'NSE Fee Calculator',
                        text: shareText,
                        url: shareUrl,
                        files: [file]
                    });
                    return;
                }
            }

            // Fallback to share without image
            await navigator.share({
                title: 'NSE Fee Calculator',
                text: shareText,
                url: shareUrl
            });
            return;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Share failed:', error);
            }
            // Fall through to copy link
        }
    }

    // Fallback: copy link to clipboard
    try {
        await navigator.clipboard.writeText(shareUrl);

        // Show feedback using textContent
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            // Store original content
            const originalText = shareBtn.textContent;

            // Show copied state
            shareBtn.textContent = '✓ Link copied!';
            shareBtn.style.background = 'var(--color-fee-low)';

            setTimeout(() => {
                shareBtn.textContent = '📤 Share this result';
                shareBtn.style.background = '';
            }, 2000);
        }
    } catch (error) {
        console.error('Failed to copy link:', error);
        alert('Link: ' + shareUrl);
    }
}
