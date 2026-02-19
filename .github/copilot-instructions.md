# GitHub Copilot Instructions — NSE Fee Calculator

## 1. Project Identity

**What this is:** A free, static web tool that shows Kenyan retail investors the exact, real cost of buying or selling shares on the Nairobi Securities Exchange (NSE).

**One-line goal:** "Enter a ticker and quantity → instantly see what you'll actually pay."

**Primary spec:** `docs/nse-fee-calculator-spec.md` is the authoritative source of truth for all product decisions, fee rates, UI behaviour, and pseudocode. Always consult it before making implementation decisions.

**Non-goals (do not build):**
- No user accounts or authentication at any stage of V1 or V2
- No backend, no database, no server-side logic
- No third-party JS frameworks (no React, Vue, Angular, Next.js)
- No CSS frameworks (no Tailwind, Bootstrap, Material UI)
- No Google Analytics — use Plausible or Umami only
- No payment processing, no trading execution, no order routing

---

## 2. Tech Stack (Hard Constraints)

| Layer | Choice | Reason |
|:--|:--|:--|
| HTML | Vanilla HTML5 | No build step. Indexable by Google directly. |
| CSS | Vanilla CSS with custom properties | Dark mode via `prefers-color-scheme`. No overhead. |
| JS | Vanilla JavaScript (ES2020+) | No framework, no bundler required. Works on any phone. |
| Hosting | GitHub Pages or Vercel | Free. Custom domain later. |
| PWA | Service worker + `manifest.json` | V1 requirement — Kenya's mobile-data reality. |
| Analytics | Plausible or Umami | Privacy-first. No cookies. No GDPR exposure. |

**Performance budget (non-negotiable):**
- First Contentful Paint < 1.0s on 3G
- Total initial page weight < 100KB (HTML + CSS + JS + data combined)
- JS bundle < 30KB unminified
- No external requests on first load
- `html2canvas` (~60KB) must be lazy-loaded via `dynamic import()` — only when the user taps "Share". It must never be in the initial bundle.

---

## 3. Repository Structure

```
nse-fee-calculator/
├── index.html              # Single page app — all content here
├── css/
│   └── style.css           # Mobile-first. CSS custom properties for theming.
├── js/
│   ├── calculator.js       # Core fee engine — pure functions only, zero DOM access
│   ├── ui.js               # DOM manipulation, event listeners, rendering
│   ├── share.js            # Feature 5: lazy html2canvas share card
│   └── data.js             # Loads and exposes stocks/fees/brokers JSON
├── data/
│   ├── stocks.json         # All NSE tickers with last closing prices
│   ├── fees.json           # Fee rate configuration
│   └── brokers.json        # Broker comparison data
├── assets/
│   ├── favicon.ico
│   └── og-image.png        # 1200×630 social sharing image
├── sw.js                   # Service worker — cache strategy: stale-while-revalidate for data/
├── manifest.json           # PWA manifest
└── docs/                   # Project documentation (do not serve, not part of the web app)
```

**Key rule:** `calculator.js` must contain only pure functions with no DOM access, no side effects, and no global state. It must be independently unit-testable. All DOM interaction lives in `ui.js`.

---

## 4. Fee Calculation Rules (Source of Truth)

These constants are confirmed and must not be changed without updating `docs/nse-fee-calculator-spec.md` first, with a specific source cited.

### 4.1 Statutory Rates (as of Feb 2026)

| Fee | Rate | Constant |
|:--|:--|:--|
| NSE Transaction Levy | 0.12% | `0.0012` |
| CMA Levy | 0.08% | `0.0008` |
| CDSC Transaction Levy | **0.08%** | `0.0008` |
| ICF / Guarantee Fund | 0.01% | `0.0001` |
| VAT on Brokerage | 16% | `0.16` |

> **Critical:** CDSC is `0.0008` (0.08%), confirmed per `cdsc.co.ke` Oct 2025. A previous spec version had this wrong at 0.04%. Do not revert to 0.0004.

### 4.2 Stamp Duty

```javascript
const stampDuty = Math.ceil(consideration / 10000) * 2;
```

- Applies to **every individual trade** (buy and sell separately — not per settlement)
- Minimum is always KES 2 (even on a KES 1 trade)
- Charged on both buy side and sell side — both must be included in break-even calculation
- VAT does **not** apply to stamp duty

### 4.3 VAT

VAT (16%) applies **only to brokerage commission**. It does not apply to NSE levy, CMA levy, CDSC fee, ICF levy, or stamp duty.

```javascript
const vatOnBrokerage = brokerage * 0.16;
```

### 4.4 Minimum Broker Fee

```javascript
const brokerage = Math.max(consideration * brokerageRate, minBrokerageFee);
```

VAT is recalculated on the post-minimum brokerage figure. If the minimum was applied, show a warning: `"⚠️ Minimum broker fee of KES X applied."` Minimum fees are quoted exclusive of VAT in Kenya.

### 4.5 Break-Even: Exact Iterative Algorithm Only

Do **not** use the `(1+r)/(1-r)` approximation — it breaks for small trades where stamp duty dominates. Use the iterative algorithm:

```javascript
let sellPrice = buyPrice;
const MAX_ITER = 10000;
for (let i = 0; i < MAX_ITER; i++) {
  sellPrice += 0.01;
  const sellResult = calculateTradeCost('sell', sellPrice, qty, brokerageRate, minFee);
  if (sellResult.totalProceeds >= buyTotalCost) break;
}
```

At typical NSE price ranges, this converges in < 200 iterations and runs in < 1ms.

### 4.6 Sweet Spot Quantity

The quantity at which stamp duty is fully "used" within one KES 10,000 bracket:

```javascript
const sweetSpotQty = Math.floor(10000 / pricePerShare);
```

Use `Math.floor` — NOT `Math.ceil`. `Math.ceil` pushes the quantity into the next bracket, triggering an extra KES 2 stamp duty.

### 4.7 Rounding

Use `Math.round(amount * 100) / 100` after each fee component to avoid floating-point accumulation errors before summing.

---

## 5. Broker Data (Current Known Rates)

| Broker | `brokerageRate` | `minFee` | Notes |
|:--|:--|:--|:--|
| Safaricom Ziidi (Kestrel Capital) | `0.0150` | `0` | Mobile-first, omnibus CDS, no minimum |
| Standard Investment Bank (SIB) | `0.0100` | `0` | Lower commission |
| Dyer & Blair | `0.0120` | `0` | Established broker |
| Faida Investment Bank | `0.0125` | `100` | KES 100 minimum fee |
| EFG Hermes Kenya | `0.0150` | `0` | International |

Default broker on load: **Safaricom Ziidi** — this is the primary target user.

Ziidi's "~1.5% all-in" marketing = brokerage only. Statutory levies (0.29%) are additional. Total before stamp duty = ~2.04%. Always clarify this in UI copy.

---

## 6. UI Behaviour Rules

- **No "Calculate" button.** All outputs update live as inputs change. Debounce input events by 150ms.
- **No silent failures.** If an operation cannot complete (Web Share API unavailable, html2canvas fails on low memory), a visible fallback must always appear — specifically a "Copy link" button showing the pre-filled URL.
- **No speculation in UI.** Do not show unconfirmed regulatory changes, pending legislation, or estimates that aren't derived from the calculator inputs. The UI shows only confirmed, verifiable numbers.
- **Broker dropdown is required, not optional.** It is step 3 of the input flow. It pre-populates brokerage rate and minimum fee. The user should never have to type a rate manually unless they select "Other / Custom."
- **Price field always shows its date.** Display `"Closing price as of YYYY-MM-DD — tap to edit"` at all times. If price data is > 7 days old, show a prominent warning. The user can always override with a live price.
- **Stepper buttons (+ and −) for quantity.** Minimum touch target: 44×44px. This is critical for mobile — typing exact quantities is painful on a touchscreen.
- **Fee thermometer** is a pure CSS element — no library. `width: X%` on a gradient bar, capped at 100%. Color thresholds: green < 1.6%, amber 1.6–3%, orange 3–5%, red > 5%.
- **Fee Impact by Quantity table** must be lazy-rendered — only after the first calculation completes, not on page load.
- **Results card must have** `aria-live="polite"` so screen readers announce output changes.

### Color Coding System

| Fee % | Emoji | CSS class | Label |
|:--|:--|:--|:--|
| < 1.6% | 🟢 | `.fee-low` | "Low fees" |
| 1.6% – 3.0% | 🟡 | `.fee-moderate` | "Moderate fees" |
| 3.0% – 5.0% | 🟠 | `.fee-high` | "High fees" |
| > 5.0% | 🔴 | `.fee-very-high` | "Very high fees" |

Color must never be the **only** indicator — always pair with emoji + text label (accessibility).

---

## 7. URL Parameters (Deep Linking)

Supported params: `?ticker=SCOM&qty=10&broker=ziidi&direction=buy`

On page load, read all URL params and pre-populate inputs. Validate each: fall back to defaults if a ticker is not in `stocks.json` or a broker slug is not in `brokers.json`. Default broker: `ziidi`. Default direction: `buy`. Default qty: `10`.

When results change, update the URL via `history.replaceState()` — no page reload. This makes every result state shareable.

Broker param uses the broker's `id` field from `brokers.json` (e.g., `ziidi`, `faida`, `sib`).

---

## 8. PWA / Service Worker

The service worker must be live in V1. Use **stale-while-revalidate** for `data/*.json` files so:
- Online users always get fresh price data on next load
- Offline users get cached data as fallback

Cache strategy for static assets (HTML, CSS, JS): **cache-first**.

Include a visible `"Last updated: [date]"` timestamp in the footer so offline users know how stale the cached data might be.

---

## 9. Share Card (Feature 5)

`html2canvas` must be loaded lazily:

```javascript
// In share.js — only called when user taps Share
async function generateShareCard() {
  const { default: html2canvas } = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js');
  // ... capture and share
}
```

Share flow:
1. Generate PNG of results card via html2canvas
2. Try `navigator.share()` with the image and pre-filled URL
3. If `navigator.share` is not supported or throws: show visible **"Copy link"** button with the URL pre-copied to clipboard
4. Never catch errors silently

---

## 10. V1 vs V2 Scope Boundaries

**V1 must include (no exceptions):**
- Trade cost calculator with live breakdown
- Fee Impact comparison table
- Break-even calculator
- Broker comparison table (Feature 4)
- Shareable results card (Feature 5)
- PWA + service worker + manifest
- URL params / deep linking
- Dark mode
- Stale price warning + manual override

**V2 (do not build for V1):**
- Contract Note Analyzer (PDF upload via pdf.js)
- Portfolio fee tracker
- Swahili language toggle
- Per-ticker SEO landing pages (build script)
- Bond/T-Bill yield calculator
- Dividend WHT calculator
- Any form of user accounts, login, or persistent storage

---

## 11. Open Questions Policy

Track all unresolved data or product questions in the `## 12. Open Questions` table of `docs/nse-fee-calculator-spec.md`. Any question marked `🔴 OPEN — MUST VERIFY BEFORE BUILD` is a hard blocker — do not finalize any code that depends on it. Currently all questions are closed (v1.3).

If a fee rate, broker rate, or regulatory fact cannot be confirmed from a primary source (CDSC, CMA, NSE, or an actual broker contract note), open a new question rather than guessing.

---

## 12. Code Style

- **ES2020+** — use `const`/`let`, arrow functions, `async/await`, `dynamic import()`, optional chaining, nullish coalescing
- No `var`
- Pure functions in `calculator.js` — no side effects, deterministic output for any given input
- JSDoc comments on all exported functions in `calculator.js`:
  ```javascript
  /**
   * @param {number} consideration - Trade value in KES (price × qty)
   * @param {number} brokerageRate - Brokerage rate as decimal (e.g. 0.015 for 1.5%)
   * @param {number} minBrokerageFee - Minimum brokerage fee in KES (0 if none)
   * @returns {{ brokerage: number, vatOnBrokerage: number, ... }}
   */
  ```
- No magic numbers — use named constants for all fee rates:
  ```javascript
  const NSE_LEVY_RATE  = 0.0012;
  const CMA_LEVY_RATE  = 0.0008;
  const CDSC_LEVY_RATE = 0.0008;  // Confirmed 0.08% per cdsc.co.ke Oct 2025
  const ICF_LEVY_RATE  = 0.0001;
  const VAT_RATE       = 0.16;
  const STAMP_PER_BRACKET = 2;
  const STAMP_BRACKET_SIZE = 10000;
  ```
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

---

## 13. Testing

Unit-test `calculator.js` pure functions against the four worked examples in `docs/nse-fee-calculator-spec.md` § 6. These are regression anchors — if any example output changes, a fee rate or formula has changed and the spec must be updated with justification first.

Key test cases:
- **Example 1:** Buy 1 ABSA @ KES 30.20 → fees = KES 2.47, fee% = 8.18%, YOU PAY KES 32.67
- **Example 2:** Buy 10 SCOM @ KES 33.85 → fees = KES 7.38, fee% = 2.18%
- **Example 3:** Buy 5 EQTY @ KES 74.75 → fees = KES 7.95, fee% = 2.13%
- **Example 4:** Sell 100 KCB @ KES 75.00 → fees = KES 121.19, fee% = 1.62%, receive = KES 7,378.81

Edge case tests:
- Minimum fee applied (`consideration × rate < minFee`)
- Stamp duty bracket boundary (`consideration = 9,999.99` vs `10,000.00` vs `10,000.01`)
- `sweetSpotQty` correctness — verify FLOOR not CEILING
- Break-even iterative convergence

---

## 14. Security & Privacy Notes

- No user data is collected, stored, or transmitted. All computation is client-side.
- No cookies.
- No personal information in URL params — only calculation inputs (ticker, qty, broker, direction).
- Affiliate links (Phase 2) must be disclosed with a visible "Affiliate link" label. Do not use deceptive link labeling.
- If any V2 feature ever sends data to a server, a privacy notice and Kenya Data Protection Act 2019 compliance review is required first.
