# NSE Fee Calculator — Product Specification

> **Project**: A free, public web tool that shows Kenyan retail investors the **exact, real cost** of buying or selling shares on the Nairobi Securities Exchange (NSE).
>
> **Problem**: Retail investors — especially new ones using Ziidi, DYER & BLAIR, or other mobile brokers — don't know what a trade actually costs until after they've executed it. Fees are opaque, scattered across multiple bodies (broker, NSE, CMA, CDSC, KRA), and the flat Sh2 stamp duty disproportionately punishes small trades. Business Daily (Feb 19, 2026) reported that buying a single ABSA share costs **7.78% in fees**.
>
> **Goal**: "Enter a ticker and quantity → instantly see what you'll actually pay." No signup. No ads (initially). No BS.
>
> **Target audience**: Kenyan retail investors, especially beginners on platforms like Safaricom Ziidi, EFG Hermes, SIB, and anyone considering entering the NSE.
>
> **Tech stack**: Static site (HTML + CSS + JS). No backend needed for V1. Hosted free on GitHub Pages or Vercel. **PWA with service worker ships in V1** (Kenya's mobile-data constraints make offline capability a day-1 requirement, not a future feature).

---

## Table of Contents

1. [Fee Structure Reference](#1-fee-structure-reference)
2. [Core Features (V1 — MVP)](#2-core-features-v1--mvp)
3. [UI/UX Specification](#3-uiux-specification)
4. [Data Model](#4-data-model)
5. [Calculation Logic (Pseudocode)](#5-calculation-logic-pseudocode)
6. [Example Calculations](#6-example-calculations)
7. [Ticker & Price Data](#7-ticker--price-data)
8. [Future Features (V2+)](#8-future-features-v2)
9. [Technical Implementation Notes](#9-technical-implementation-notes)
10. [Content / SEO Strategy](#10-content--seo-strategy)
11. [Monetization Path](#11-monetization-path)
12. [Open Questions](#12-open-questions)

---

## 1. Fee Structure Reference

These are the actual fees charged on every NSE equity transaction (buy or sell) as of February 2026. Sources: CMA Gazette, NSE website, broker fee schedules, BD reporting.

### 1.1 Equity Trading Fees (Secondary Market)

| Fee | Charged By | Rate | Applies To | Min/Max | Notes |
|:--|:--|:--|:--|:--|:--|
| **Brokerage Commission** | Stockbroker (e.g. Kestrel/Ziidi, SIB, Faida) | Negotiable; typically **1.12–1.50%** of consideration | Buy & Sell | Some brokers have a minimum fee (e.g. KES 100). Ziidi = KES 0 minimum. | **Ziidi charges ~1.50% brokerage**; statutory levies (NSE/CMA/CDSC/ICF) are additional on top, making the total before stamp duty ≈ 2.00%. Ziidi's "~1.5% all-in" marketing refers to brokerage only. |
| **NSE Transaction Levy** | Nairobi Securities Exchange | **0.12%** of consideration | Buy & Sell | None | |
| **CMA Levy** | Capital Markets Authority | **0.08%** of consideration | Buy & Sell | None | Regulatory fee |
| **CDSC Fee** | Central Depository & Settlement Corp | **0.04%** of consideration | Buy & Sell | None | Settlement/custody |
| **Investor Compensation Fund** | ICF (via CMA) | **0.01%** of consideration | Buy & Sell | None | Investor protection levy |
| **Stamp Duty** | Kenya Revenue Authority | **KES 2 per KES 10,000** (or part thereof) of consideration | Buy & Sell | Flat floor of KES 2 | This is the killer on small trades. Charged on every Sh10,000 bracket. |
| **VAT on Brokerage** | KRA | **16%** of the brokerage commission | Buy & Sell | None | VAT applies only to the brokerage fee, not other levies |

### 1.2 Summary of Percentage-Based Fees (excluding stamp duty)

| Component | Rate (Traditional ~1.12% broker) | Rate (Safaricom Ziidi) |
|:--|:--|:--|
| Brokerage | 1.12% (typical; negotiable) | **1.50%** |
| VAT on Brokerage | 0.1792% (= 1.12% × 16%) | 0.24% (= 1.50% × 16%) |
| NSE Levy | 0.12% | 0.12% |
| CMA Levy | 0.08% | 0.08% |
| CDSC Fee | 0.04% | 0.04% |
| ICF Levy | 0.01% | 0.01% |
| **Total (excl. stamp duty)** | **~1.5492%** | **~2.00%** |

> ⚠️ **Ziidi Clarification (confirmed)**: Ziidi's marketed "~1.5% all-in" refers to **brokerage only**. Statutory levies (0.25%) are charged on top, making the true total before stamp duty ~2.00%. Always select "Safaricom Ziidi" in the broker dropdown — do not use the 1.12% default for Ziidi trades.

### 1.3 Stamp Duty Deep Dive

Stamp duty on NSE transactions is governed by the Stamp Duty Act. The rate is **KES 2 for every KES 10,000** (or part thereof) of the transaction value ("consideration").

**How it's calculated:**
- Take the consideration (shares × price)
- Divide by 10,000
- Round **UP** to the next whole number (ceiling function)
- Multiply by 2

**Examples:**
- Consideration = KES 150 → ceil(150/10000) = 1 → Stamp Duty = KES 2
- Consideration = KES 10,000 → ceil(10000/10000) = 1 → Stamp Duty = KES 2
- Consideration = KES 10,001 → ceil(10001/10000) = 2 → Stamp Duty = KES 4
- Consideration = KES 50,000 → ceil(50000/10000) = 5 → Stamp Duty = KES 10

**Why this matters:** On a KES 150 trade, the KES 2 stamp duty alone is **1.33%** of the trade value. On a KES 10,000 trade, it's only 0.02%. This is a regressive tax that punishes small retail investors.

### 1.4 IPO Fees

| Fee | Rate | Notes |
|:--|:--|:--|
| Brokerage | **0%** | No brokerage on IPO applications |
| Other levies | **0%** | No CMA/NSE/CDSC fees on IPO |
| Stamp Duty | **KES 2 per KES 10,000** | Still applies to the application amount |

> IPOs are essentially free to apply for (minus stamp duty). However, when the investor later **sells** the IPO shares on the secondary market, standard fees apply to the sell transaction.

### 1.5 Bond Trading Fees (Future Feature)

Government bonds (T-Bills, T-Bonds, Infrastructure Bonds) via DhowCSD have a different fee structure:
- No brokerage for direct CBK auctions
- Withholding Tax: 15% on interest (0% for Infrastructure Bonds held to maturity)
- Minimum investment: KES 50,000

*Bond calculator is a V2 feature.*

---

## 2. Core Features (V1 — MVP)

### Feature 1: Trade Cost Calculator

**Input:**
1. **Trade direction**: BUY or SELL (toggle/radio)
2. **Ticker or Stock Name**: Dropdown/autocomplete with all NSE-listed stocks (e.g. "SCOM — Safaricom PLC")
3. **Broker** *(required — not optional or "advanced")*: Dropdown that auto-populates brokerage rate + minimum fee for that broker. No need to know a rate manually.
   - Safaricom Ziidi (Kestrel Capital) — 1.50%, min KES 0
   - Standard Investment Bank (SIB) — 1.00%, min KES 0
   - Dyer & Blair — 1.20%, min KES 0
   - Faida Investment Bank — 1.25%, min KES 100
   - EFG Hermes — 1.50%, min KES 0
   - Other / Custom — text input appears for custom rate + custom min fee
4. **Price per share**: Auto-populated from ticker selection. **Manual override is a V1 requirement** (not a nice-to-have). Show a small "Closing price as of YYYY-MM-DD — tap to edit" prompt. User must always be able to type their exact live price.
5. **Number of shares**: Integer input with `+` and `−` stepper buttons (critical for mobile — typing 1000 is painful). Minimum = 1. Updates calculation instantly on every change.

**Output (displayed instantly on input change — no submit button):**
A clear breakdown table:

| Line Item | Amount (KES) | % of Trade |
|:--|:--|:--|
| **Shares Value** (Consideration) | *qty × price* | 100.00% |
| Brokerage Commission | | |
| VAT on Brokerage (16%) | | |
| NSE Transaction Levy (0.12%) | | |
| CMA Levy (0.08%) | | |
| CDSC Fee (0.04%) | | |
| Investor Compensation Fund (0.01%) | | |
| Stamp Duty (KES 2 / KES 10,000) | | |
| **Total Fees** | | |
| **Total Cost** (You Pay / You Receive) | | |

**For BUY:** Total Cost = Consideration + Total Fees (what leaves your wallet)
**For SELL:** Total Proceeds = Consideration − Total Fees (what hits your wallet)

**Key UX elements:**
- **Primary hero** (biggest text on screen): "YOU PAY: KES 345.75" (BUY) or "YOU RECEIVE: KES 7,381.81" (SELL). This answers the beginner's first question — *"how much do I need in my account?"*
- **Secondary hero** (medium, color-coded): "Fees: KES 7.25 (2.14%) 🟡" — the *educational* hook.
- One-line plain-English summary: *"Buying 10 shares of SCOM at KES 33.85 costs you KES 345.75 total. Fees eat KES 7.25 (2.14%)."*
- Show stamp duty separately with a ⚠️ icon if it's >0.5% of the trade value, with tooltip: *"Stamp duty is KES 2 per every KES 10,000. On small trades, this flat charge becomes a large percentage — the hidden cost of buying fewer shares."*
- Show a **"Price as of YYYY-MM-DD"** badge next to the price field at all times — stale data must never be invisible.

### Feature 2: Fee Impact Comparison Table

**What it does:** Shows a side-by-side comparison of fees at different trade sizes for the selected stock.

**Output example (for SCOM at KES 33.85):**

| Quantity | Trade Value | Total Fees | Fee % | Stamp Duty % of Fees |
|:--|:--|:--|:--|:--|
| 1 | 33.85 | 2.52 | **7.45%** 🔴 | 79.4% |
| 5 | 169.25 | 4.62 | **2.73%** 🟡 | 43.3% |
| 10 | 338.50 | 7.25 | **2.14%** 🟡 | 27.6% |
| 50 | 1,692.50 | 28.24 | **1.67%** 🟢 | 7.1% |
| 100 | 3,385.00 | 54.48 | **1.61%** 🟢 | 3.7% |
| 296+ | 10,018.60 | 157.28 | **1.57%** 🟢 | 1.3% |

> This table instantly educates the user: "Oh, buying 1 share is a terrible deal because of stamp duty. I should buy at least 10-50 to keep fees reasonable."

Add an **opinionated verdict row** at the bottom of the table:

| Range | Verdict |
|:--|:--|
| 1–3 shares | 🔴 **Avoid** — stamp duty dominates. Fee > 5%. |
| 4–20 shares | 🟡 **Acceptable** — fees are moderate but stamp duty still significant. |
| 21+ shares | 🟢 **Good range** — fees below 2% and declining with quantity. |
| `sweetSpotQty`+ | 🟢 **Optimal** — stamp duty ≤ 0.02% of trade value. |

**Smart prompt when fee% > 5%:** Instead of just showing the scary number, add an actionable suggestion:
> *"⚠️ Fees are eating 7.45% of this trade. Consider saving KES [X] more in an MMF (earning ~10%) until you can buy [sweetSpotQty] shares at once — your fee would drop to 1.57%."*

**The 296+ row**: Automatically calculate and display the **minimum quantity** where stamp duty becomes ≤ 0.02% (i.e., the "sweet spot" where the Sh10K threshold is fully utilized). Formula: `ceil(10000 / price_per_share)`.

### Feature 3: Break-Even Calculator

**What it does:** "How much does the stock need to rise before I'm in profit after fees?"

**Input:** Same as Feature 1 (reuses the data).

**Output:**
- Break-even price for a round trip (buy + sell): *"SCOM needs to reach KES 34.90 (+3.10%) before you break even after buying at KES 33.85 and selling."*
- Rephrase to be emotional, not mechanical: *"The stock must rise **3.10% before you make even one shilling in profit.** If it only rises 2%, you are still losing money."*
- ⚠️ Add a disclaimer: *"This is an estimate. The fixed KES 2 stamp duty on both buy and sell means the exact break-even depends on your precise trade size."*
- For implementation: use an **exact iterative algorithm** (not the `(1+r)/(1-r)` approximation). Increment sellPrice by KES 0.01 until `sellProceeds(sellPrice, qty) >= buyTotalCost(buyPrice, qty)`. At the price ranges involved, this runs in <1ms in JS and is always accurate.
- Days at current average daily movement to break even (if we have historical volatility data — V2).

### Feature 4: Broker Comparison (Stretch for V1)

**What it does:** Compare total fees across popular Kenyan brokers for the same trade.

| Broker | Brokerage Rate | Total Fees | Fee % | Notes |
|:--|:--|:--|:--|:--|
| **Safaricom Ziidi** (Kestrel Capital) | **1.50%** | KES X | X% | Mobile-first. Omnibus CDS. No min fee. |
| **EFG Hermes** | 1.50% | KES X | X% | International broker |
| **Faida Investment Bank** | 1.25% | KES X | X% | Traditional broker |
| **SIB (Standard Investment Bank)** | 1.00% | KES X | X% | Lower commission |
| **Dyer & Blair** | 1.20% | KES X | X% | Established broker |

> Note: Brokerage rates are negotiable and may vary. These are indicative standard retail rates. Users can customize.

### Feature 5: Shareable Results Card

**What it does:** Generates a WhatsApp/Twitter-ready image of the current calculation with one tap. This is the primary viral growth mechanism — people share surprising fee results.

**Implementation**: `html2canvas` (~5 lines of JS, ~60KB) captures the results card as a PNG. The share button triggers the Web Share API on mobile, falling back to download on desktop.

**Card design**:
```
┌────────────────────────────────┐
│  🇰🇪 NSE Fee Calculator        │
│                                │
│  Buying 10 SCOM @ KES 33.85   │
│  YOU PAY: KES 345.75           │
│  Fees: KES 7.25 (2.14%) 🟡    │
│                                │
│  Stamp Duty: KES 2.00          │
│  Break-even: KES 34.90 +3.10%  │
│                                │
│  Check yours → nsecalc.co.ke   │
└────────────────────────────────┘
```

**CTA text auto-generated**:
- Normal fees: *"I just checked my NSE trade cost. Fees: 2.14%. Check yours 👇 nsecalc.co.ke"*
- High fees: *"😱 Buying 1 ABSA share on NSE costs 8.15% in fees! Check yours 👇 nsecalc.co.ke"*

**Share targets**: WhatsApp (primary for Kenya), Twitter/X, copy link with `?ticker=SCOM&qty=10&broker=ziidi&direction=buy` URL params pre-filled (so shared links open with exact pre-filled values).

---

## 3. UI/UX Specification

### 3.1 Design Principles

1. **Mobile-first**: >70% of Kenyan internet users are on mobile. Design for a 360px-wide screen first.
2. **Instant feedback**: No "Calculate" button. All outputs update live as inputs change (debounced by 150ms).
3. **Plain English**: Every number has a human-readable explanation next to it.
4. **Dark mode**: Support system preference (`prefers-color-scheme`). Many users browse at night.
5. **Fast**: Target <1s load on 3G. No frameworks, no heavy JS. Vanilla HTML/CSS/JS or lightweight (Alpine.js at most).
6. **Offline-capable (V1)**: Service worker + PWA manifest. Calculator works without internet once loaded. Essential for Kenya's mobile data context — users should be able to pin it to their home screen.
7. **Swahili toggle** (V2): Kiswahili translation for broader reach.

### 3.2 Page Layout (Single Page)

```
┌─────────────────────────────────────┐
│  NSE Fee Calculator                 │
│  "Know what you'll really pay"      │
├─────────────────────────────────────┤
│                                     │
│  [BUY] [SELL]  (toggle)             │
│                                     │
│  Stock: [SCOM — Safaricom    ▼]     │
│  Broker:[Safaricom Ziidi     ▼]     │
│  Price: [33.85] KES  ← as of 18 Feb │
│  Shares: [−] [10] [+]               │
│                                     │
│  ┌─────────────────┐  ┌──────────┐  │
│  │ YOU PAY:        │  │Fee Meter │  │
│  │ KES 345.75      │  │  ████░░  │  │
│  │ (big, bold)     │  │  2.14%   │  │
│  │                 │  │  🟡      │  │
│  │ Fees: KES 7.25  │  └──────────┘  │
│  │ (2.14%) 🟡      │               │
│  │ Stamp: KES 2 ⚠️ │               │
│  └─────────────────┘               │
│                                     │
│  ▼ Full Breakdown                   │
│  ┌───────────────────────────────┐  │
│  │ Shares Value      338.50      │  │
│  │ Brokerage (1.50%)   5.08      │  │
│  │ VAT on Brokerage    0.81      │  │
│  │ NSE Levy (0.12%)    0.41      │  │
│  │ CMA Levy (0.08%)    0.27      │  │
│  │ CDSC Fee (0.04%)    0.14      │  │
│  │ ICF Levy (0.01%)    0.03      │  │
│  │ Stamp Duty           2.00      │  │
│  │ ─────────────────────────      │  │
│  │ Total Fees           8.74      │  │
│  │ TOTAL YOU PAY      347.24      │  │
│  └───────────────────────────────┘  │
│                                     │
│  📊 Fee Impact by Quantity          │
│  (comparison table — with verdicts) │
│                                     │
│  📈 Break-Even                      │
│  "Stock must rise 3.10% before      │
│   you make a single shilling"       │
│                                     │
│  [📤 Share this result]             │
│                                     │
│  ───────────────────────────────    │
│  ℹ️ How NSE fees work (expandable)  │
│  📖 Guide: Your first stock trade   │
│  🔗 Open Ziidi | Open DhowCSD      │
│                                     │
│  Built by [us] • Prices: Feb 18 26  │
│  Not financial advice. Verify with  │
│  your broker before trading.        │
└─────────────────────────────────────┘
```

### 3.3 Fee Thermometer Visual

A vertical or horizontal bar shown next to (or above) the fee% hero number:

```
1%   2%   3%   4%   5%+
█░░░░   "Low"     (1 share = nearly full red)
████░   "Moderate"
```

- Bar fills left-to-right (or bottom-to-top on mobile) proportionally to fee%
- Color matches the green/amber/orange/red thresholds
- At 1 share = almost completely filled with red — instant gut-feel education
- At sweet-spot qty = small green sliver — instant positive reinforcement

No library needed. Pure CSS `width: X%` + background gradient.

### 3.3 Color Coding

| Fee % Range | Color | Label |
|:--|:--|:--|
| < 1.6% | 🟢 Green | "Low fees" |
| 1.6% – 3.0% | 🟡 Amber | "Moderate fees" |
| 3.0% – 5.0% | 🟠 Orange | "High fees — consider larger quantity" |
| > 5.0% | 🔴 Red | "Very high fees — stamp duty impact" |

### 3.4 Responsive Breakpoints

| Breakpoint | Layout |
|:--|:--|
| < 480px (phone) | Single column. Inputs stacked. Results card below. |
| 480–768px (tablet) | Inputs left, results right. Comparison table scrollable. |
| > 768px (desktop) | Full side-by-side. Comparison table inline. |

---

## 4. Data Model

### 4.1 Stock Data (JSON)

```json
{
  "stocks": [
    {
      "ticker": "SCOM",
      "name": "Safaricom PLC",
      "sector": "Telecommunications",
      "price": 33.85,
      "priceDate": "2026-02-18",
      "market": "MIMS",
      "isSuspended": false
    },
    {
      "ticker": "EQTY",
      "name": "Equity Group Holdings PLC",
      "sector": "Banking",
      "price": 74.75,
      "priceDate": "2026-02-18",
      "market": "MIMS",
      "isSuspended": false
    }
  ]
}
```

**Fields:**
- `ticker`: NSE ticker symbol (string, uppercase)
- `name`: Full company name as listed on NSE
- `sector`: Industry sector (for filtering/grouping)
- `price`: Last closing price in KES (number, 2 decimal places)
- `priceDate`: ISO date of the price (string, YYYY-MM-DD)
- `market`: Market segment — `"MIMS"` (Main), `"AIMS"` (Alternative), `"GEMS"` (Growth), `"FISMS"` (Fixed Income), `"REIT"`, `"ETF"`
- `isSuspended`: Boolean — if true, disable the stock in the dropdown and show "Trading suspended"

### 4.2 Fee Configuration (JSON)

```json
{
  "fees": {
    "brokerage": {
      "defaultRate": 0.0112,
      "minFee": 0,
      "description": "Stockbroker commission"
    },
    "vatOnBrokerage": {
      "rate": 0.16,
      "description": "VAT charged on brokerage commission only"
    },
    "nseLevy": {
      "rate": 0.0012,
      "description": "NSE transaction levy"
    },
    "cmaLevy": {
      "rate": 0.0008,
      "description": "Capital Markets Authority levy"
    },
    "cdscFee": {
      "rate": 0.0004,
      "description": "Central Depository & Settlement Corporation fee"
    },
    "icfLevy": {
      "rate": 0.0001,
      "description": "Investor Compensation Fund levy"
    },
    "stampDuty": {
      "ratePerBracket": 2,
      "bracketSize": 10000,
      "description": "KES 2 per every KES 10,000 or part thereof"
    }
  },
  "lastUpdated": "2026-02-19",
  "source": "CMA Gazette / NSE Fee Schedule"
}
```

### 4.3 Broker Data (JSON)

```json
{
  "brokers": [
    {
      "name": "Safaricom Ziidi (Kestrel Capital)",
      "brokerageRate": 0.0150,
      "minFee": 0,
      "platform": "Mobile App",
      "cdsType": "Omnibus",
      "notes": "Single-share trading. No minimum lot. No minimum fee. Brokerage is 1.50% (not 1.12%). Cannot pledge shares as collateral. Ziidi markets '~1.5% all-in' which is brokerage only — statutory levies are on top."
    },
    {
      "name": "Faida Investment Bank",
      "brokerageRate": 0.0125,
      "minFee": 100,
      "platform": "Web / In-person",
      "cdsType": "Individual",
      "notes": "Traditional broker. Individual CDS account."
    },
    {
      "name": "Standard Investment Bank (SIB)",
      "brokerageRate": 0.0100,
      "minFee": 0,
      "platform": "Mobile App / Web",
      "cdsType": "Individual",
      "notes": "Lower commission. Individual CDS."
    },
    {
      "name": "Dyer & Blair",
      "brokerageRate": 0.0120,
      "minFee": 0,
      "platform": "Web / In-person",
      "cdsType": "Individual",
      "notes": "Established broker."
    },
    {
      "name": "EFG Hermes Kenya",
      "brokerageRate": 0.0150,
      "minFee": 0,
      "platform": "Web / Mobile",
      "cdsType": "Individual",
      "notes": "International broker with Kenya presence."
    }
  ]
}
```

---

## 5. Calculation Logic (Pseudocode)

```
FUNCTION calculateTradeCost(direction, pricePerShare, quantity, brokerageRate, minBrokerageFee):

    // Step 1: Consideration (trade value)
    consideration = pricePerShare * quantity

    // Step 2: Brokerage (apply minimum fee if applicable)
    brokerageRaw   = consideration * brokerageRate
    brokerage      = MAX(brokerageRaw, minBrokerageFee)  // ← CRITICAL: min fee logic
    IF brokerage > brokerageRaw:
        showWarning("Minimum broker fee of KES " + minBrokerageFee + " applied")

    // Step 3: Other percentage-based fees (applied to consideration, NOT brokerage)
    vatOnBrokerage  = brokerage * 0.16               // VAT only on brokerage
    nseLevy         = consideration * 0.0012
    cmaLevy         = consideration * 0.0008
    cdscFee         = consideration * 0.0004
    icfLevy         = consideration * 0.0001

    // Step 4: Stamp Duty (flat bracketed fee)
    stampDutyBrackets = CEILING(consideration / 10000)
    stampDuty         = stampDutyBrackets * 2

    // Step 5: Total fees
    totalFees = brokerage + vatOnBrokerage + nseLevy + cmaLevy + cdscFee + icfLevy + stampDuty

    // Step 6: Total cost or proceeds
    IF direction == "BUY":
        totalAmount = consideration + totalFees   // What leaves your wallet
    ELSE IF direction == "SELL":
        totalAmount = consideration - totalFees   // What arrives in your wallet

    // Step 7: Fee percentage
    feePercentage = (totalFees / consideration) * 100

    // Step 8: Exact break-even price (iterative — NOT the (1+r)/(1-r) approximation)
    // The approximation breaks down because stamp duty is a fixed bracket fee.
    // Exact approach: find the minimum sell price where sell proceeds ≥ buy total cost.
    buyTotalCost = consideration + totalFees  // What we paid on the buy side
    sellPrice    = pricePerShare
    REPEAT:
        sellPrice = sellPrice + 0.01
        sellConsideration = sellPrice * quantity
        sellBrokerage     = MAX(sellConsideration * brokerageRate, minBrokerageFee)
        sellVat           = sellBrokerage * 0.16
        sellNse           = sellConsideration * 0.0012
        sellCma           = sellConsideration * 0.0008
        sellCdsc          = sellConsideration * 0.0004
        sellIcf           = sellConsideration * 0.0001
        sellStamp         = CEILING(sellConsideration / 10000) * 2
        sellTotalFees     = sellBrokerage + sellVat + sellNse + sellCma + sellCdsc + sellIcf + sellStamp
        sellProceeds      = sellConsideration - sellTotalFees
    UNTIL sellProceeds >= buyTotalCost
    breakEvenPrice = sellPrice
    breakEvenPct   = ((breakEvenPrice - pricePerShare) / pricePerShare) * 100

    // Step 9: Sweet spot quantity (where stamp duty ≤ 0.02% of consideration)
    sweetSpotQty = CEILING(10000 / pricePerShare)

    RETURN {
        consideration,
        brokerage,
        minFeeApplied: (brokerage > brokerageRaw),
        vatOnBrokerage,
        nseLevy,
        cmaLevy,
        cdscFee,
        icfLevy,
        stampDuty,
        stampDutyBrackets,
        totalFees,
        totalAmount,
        feePercentage,
        breakEvenPrice,
        breakEvenPct,
        sweetSpotQty,
        // Breakdown for display
        feeDetails: [
            { label: "Brokerage Commission",     amount: brokerage,      rate: brokerageRate, minApplied: minFeeApplied },
            { label: "VAT on Brokerage (16%)",   amount: vatOnBrokerage, rate: null },
            { label: "NSE Levy",                 amount: nseLevy,        rate: 0.0012 },
            { label: "CMA Levy",                 amount: cmaLevy,        rate: 0.0008 },
            { label: "CDSC Fee",                 amount: cdscFee,        rate: 0.0004 },
            { label: "ICF Levy",                 amount: icfLevy,        rate: 0.0001 },
            { label: "Stamp Duty",               amount: stampDuty,      rate: null }
        ]
    }
```

### 5.1 Edge Cases to Handle

| Case | Handling |
|:--|:--|
| Quantity = 0 | Show "Enter a quantity" — don't calculate |
| Quantity < 0 | Block negative input. Minimum = 1. |
| Price = 0 | Show "Enter a price" — don't calculate |
| Very large quantity (>1M shares) | Allow but add a note "This exceeds typical retail volume" |
| Suspended stock selected | Disable calculator, show "This stock is currently suspended from trading" |
| IPO mode (future) | Set brokerage = 0, all levies = 0, only stamp duty applies. Show note "IPO applications have no brokerage fees." |
| Minimum broker fee triggered | If `brokerage < broker.minFee`, use `broker.minFee`. Recalculate VAT on the minimum fee. Show ⚠️ "Minimum broker fee of KES X applied." This changes the math significantly for small trades on min-fee brokers. |
| Fractional KES | Round all fee amounts to 2 decimal places. Round stamp duty to whole KES (it's always a multiple of 2). |
| Price data staleness | Always show price date badge. If price is >7 days old, add a warning: "⚠️ Price data is over a week old — enter the current price manually." |

---

## 6. Example Calculations

### Example 1: Buy 1 share of ABSA at KES 30.20

```
Consideration:            30.20
Brokerage (1.12%):         0.34
VAT on Brokerage (16%):    0.05
NSE Levy (0.12%):          0.04
CMA Levy (0.08%):          0.02
CDSC Fee (0.04%):          0.01
ICF Levy (0.01%):          0.00
Stamp Duty: ceil(30.20/10000) = 1 → KES 2.00
────────────────────────────
Total Fees:                2.46
Fee %:                     8.15% 🔴
────────────────────────────
YOU PAY:                  32.66

Break-even sell price:    33.87 (+12.15%)
Sweet spot qty:           332 shares (to fill the Sh10K bracket)
```

### Example 2: Buy 10 shares of SCOM at KES 33.85

```
Consideration:           338.50
Brokerage (1.12%):         3.79
VAT on Brokerage (16%):    0.61
NSE Levy (0.12%):          0.41
CMA Levy (0.08%):          0.27
CDSC Fee (0.04%):          0.14
ICF Levy (0.01%):          0.03
Stamp Duty: ceil(338.50/10000) = 1 → KES 2.00
────────────────────────────
Total Fees:                7.25
Fee %:                     2.14% 🟡
────────────────────────────
YOU PAY:                 345.75

Break-even sell price:    35.33 (+4.37%)
Sweet spot qty:           296 shares
```

### Example 3: Buy 5 shares of EQTY at KES 74.75

```
Consideration:           373.75
Brokerage (1.12%):         4.19
VAT on Brokerage (16%):    0.67
NSE Levy (0.12%):          0.45
CMA Levy (0.08%):          0.30
CDSC Fee (0.04%):          0.15
ICF Levy (0.01%):          0.04
Stamp Duty: ceil(373.75/10000) = 1 → KES 2.00
────────────────────────────
Total Fees:                7.80
Fee %:                     2.09% 🟡
────────────────────────────
YOU PAY:                 381.55

Break-even sell price:    77.91 (+4.23%)
Sweet spot qty:           134 shares
```

### Example 4: Sell 100 shares of KCB at KES 75.00

```
Consideration:          7,500.00
Brokerage (1.12%):         84.00
VAT on Brokerage (16%):    13.44
NSE Levy (0.12%):           9.00
CMA Levy (0.08%):           6.00
CDSC Fee (0.04%):           3.00
ICF Levy (0.01%):           0.75
Stamp Duty: ceil(7500/10000) = 1 → KES 2.00
────────────────────────────
Total Fees:              118.19
Fee %:                     1.58% 🟢
────────────────────────────
YOU RECEIVE:           7,381.81
```

---

## 7. Ticker & Price Data

### 7.1 V1: Static JSON

For MVP, hardcode a JSON file with all ~65 NSE-listed equities, their tickers, names, sectors, and last known prices. Update manually from the BD market data page (we already extract this daily in our e-paper analysis).

**File**: `data/stocks.json`

**Full list of NSE tickers to include** (as of Feb 2026):

```
MAIN INVESTMENT MARKET SEGMENT (MIMS):
Banking: ABSA, BKG (BK Group), DTB (Diamond Trust), EQTY, HF, KCB, NCBA, SBIC (Stanbic), SCBK (StanChart), COOP
Insurance: BRIT, CIC, JUB (Jubilee), KRE (Kenya Re), SLAM (Sanlam)
Telecoms: SCOM
Manufacturing: BAT, CARB (Carbacid), EABL, FTGH (Flame Tree)
Energy: KEGN (KenGen), KPLC (Kenya Power), TOTL (TotalEnergies), UMME (Umeme)
Construction: ARM, BAMB (Bamburi), CABL (EA Cables), PORT (EA Portland)
Agriculture: EGAD (Eaagads), KAPC (Kapchorua), SASN (Sasini), WTK (Williamson Tea)
Commercial: DCON (Deacons), KQ (Kenya Airways), NMG (Nation Media), SMIL (Sameer), STRS (Standard Group), SCAN (ScanGroup), HMBZ (Homeboyz), SNNA (Serena)
Investment: CTUM (Centum), HAFR (Home Afrika), OLYM (Olympia), TCL (Transcentury), KURW (Kurwitu), NSE
Auto: CG (Car & General)
REIT: FAHR (ILAM Fahari I-REIT)
ETF: NGOLDETF (NewGold)

ALTERNATIVE INVESTMENT MARKET (AIMS):
AMSC (Afri Mega Agricorp)

GROWTH ENTERPRISE MARKET (GEMS):
NBV (Nairobi Business Ventures)

IPO (not yet listed):
KPC (Kenya Pipeline Company) — listing expected March 2026
```

### 7.2 V2: Live/Daily Prices

Options for automatic price updates:
1. **Scrape NSE daily closing prices** from the NSE website or a data provider
2. **Use African Markets API** (africanmarkets.com) — check pricing
3. **Parse our own BD market data extracts** — we already OCR these daily
4. **Dukascopy or similar** — check for NSE data availability
5. **CMA quarterly reports** — too infrequent

For V1, a manual update every few days from our daily analysis is sufficient. Prices don't need to be real-time — the fee structure is the value, not the price.

---

## 8. Future Features (V2+)

| Feature | Priority | Effort | Notes |
|:--|:--|:--|:--|
| **Bond yield calculator** | High | Medium | T-Bill, T-Bond, Infra Bond — show after-tax yield comparison |
| **Contract Note Analyzer** | High | Medium | User uploads their actual broker PDF statement (client-side, using pdf.js — no backend). Tool parses it, shows what they actually paid vs standard rates. "Your broker charged you 1.8% on this trade. Standard is 1.50%. You overpaid KES X." Zero privacy risk. Audit tool. |
| **Portfolio fee tracker** | High | Medium | "You've paid KES X in fees this year across Y trades" |
| **Swahili language toggle** | High | Low | i18n JSON file. Low effort, high reach. |
| **Per-ticker landing pages** | High | Low | Static SEO pages like `/scom`, `/eqty`, `/absa`. Auto-generated. Huge organic traffic potential. |
| **IPO cost calculator** | Medium | Low | Show IPO costs (stamp duty only) + secondary market sell fees |
| **Share price alerts** | Medium | High | Notify when a stock hits a target price. Needs backend. |
| **Tax calculator** | Medium | Medium | Dividend WHT, bond interest WHT, CGT exemption education |
| **Historical fee comparison** | Low | Medium | "If you had bought X in Jan, your fees would have been..." |
| **API for developers** | Low | Medium | Let other apps embed our calculator |
| **Broker signup referral** | Medium | Low | Monetization: affiliate links to Ziidi, SIB etc. |
| **WhatsApp bot** | High | Medium | "Send SCOM 10 BUY to our number → get fee breakdown" |
| **Community/Forum** | Low | High | User discussions. Way too early. |

---

## 9. Technical Implementation Notes

### 9.1 File Structure

```
nse-fee-calculator/
├── index.html              # Single page app
├── css/
│   └── style.css           # Mobile-first responsive styles
├── js/
│   ├── calculator.js       # Core calculation engine (pure functions, no DOM)
│   ├── ui.js               # DOM manipulation, event listeners, rendering
│   ├── share.js            # Feature 5: html2canvas shareable card generation
│   └── data.js             # Stock data, fee config, broker data (or import from JSON)
├── data/
│   ├── stocks.json         # All NSE tickers with prices (split: popular.json + full.json for perf)
│   ├── fees.json           # Fee configuration
│   └── brokers.json        # Broker comparison data
├── assets/
│   ├── favicon.ico
│   └── og-image.png        # Social sharing image (1200×630)
├── sw.js                   # Service worker for offline — V1 (low effort, high value for Kenya)
├── manifest.json           # PWA manifest — V1
└── README.md
```

### 9.2 Key Technical Decisions

| Decision | Choice | Reasoning |
|:--|:--|:--|
| Framework | **None — vanilla JS** | No build step. Fast. No dependencies. Works on any phone. |
| CSS | **Vanilla CSS with custom properties** | CSS variables for theming (dark mode). No Tailwind/Bootstrap overhead. |
| Hosting | **GitHub Pages** or **Vercel** | Free. Custom domain later. |
| SEO | Server-rendered HTML (it's static anyway) | Google can index everything. |
| Analytics | **Plausible** (privacy-friendly) or **Umami** (self-hosted) | No Google Analytics — keep it clean, build trust. |
| Domain | `nsecalc.co.ke` or `tradecost.ke` or subdomain of personal site | KES 1,500-3,000/year for .co.ke |
| URL parameters | `?ticker=SCOM&qty=10&broker=ziidi&direction=buy` | Deep linking, shareable results, pre-filled shared links. Read params on load and populate inputs. |
| PWA | **V1** (service worker + manifest) | Kenya's mobile-first, data-sensitive market makes offline capability a V1 requirement, not a V2 afterthought. Adding a service worker is 20 lines of code. |
| Share card | **html2canvas** (~60KB) | One-tap WhatsApp image generation. The primary viral distribution mechanism for Kenya. |

### 9.3 Accessibility

- All inputs must have `<label>` elements
- Color coding must not be the only indicator (use icons + text)
- Support keyboard navigation (tab order)
- `aria-live` region for calculator results (screen readers announce updates)
- Minimum touch target: 44×44px on mobile

### 9.4 Performance Budget

| Metric | Target |
|:--|:--|
| First Contentful Paint | < 1.0s on 3G |
| Total page weight | < 100KB (HTML + CSS + JS + data) |
| JavaScript bundle | < 30KB unminified |
| No external requests on first load | ✅ (all data inline or bundled) |

---

## 10. Content / SEO Strategy

### 10.1 Target Keywords

| Keyword | Monthly Search Volume (est.) | Competition |
|:--|:--|:--|
| "NSE trading fees" | Low but growing | None (no dedicated tools) |
| "Safaricom Ziidi fees" | Growing | Low |
| "how to buy shares in Kenya" | Medium | Medium (blog posts only) |
| "NSE share prices today" | Medium | Medium |
| "stamp duty Kenya shares" | Low | None |
| "stock market fees Kenya" | Low | None |
| "cheapest broker Kenya" | Low | None |

### 10.2 Content Pages (built into the site)

1. **"How NSE Trading Fees Work"** — Educational article explaining every fee component. Permanent page below the calculator.
2. **"Stamp Duty: The Hidden Tax on Small Investors"** — Topical article referencing the BD Feb 19 story. Headline: *"The Sh2 Tax: How Stamp Duty Makes Small NSE Trades 8% More Expensive."* Linkable, shareable, journalist-bait.
3. **"Broker Comparison Kenya 2026"** — Updated comparison of all NSE brokers' fees. High-value evergreen content.
4. **"Your First Stock Trade: A Step-by-Step Guide"** — Guide for complete beginners. Links to Ziidi, SIB signup.
5. **Per-ticker landing pages** *(V1.5 / high SEO priority)*: Auto-generated static pages for every NSE ticker. Example: `/scom`, `/eqty`, `/absa`. Each page shows the fee calculator pre-filled for that ticker + an "About SCOM fees" paragraph. Target keywords: "how much to buy Safaricom shares Kenya", "ABSA NSE fees". Zero competition. Google will rank these fast.

### 10.3 Distribution Plan

| Channel | Action | When |
|:--|:--|:--|
| **Twitter/X** | Launch tweet thread explaining the stamp duty problem + link to tool | Day 1 |
| **Reddit (r/Kenya, r/investing)** | Post the tool | Day 1-2 |
| **KenyanWallStreet** | Pitch for feature/mention | Week 1 |
| **Telegram investing groups** | Share link | Week 1 |
| **Business Daily / Nation** | Cold email journalists who wrote the stamp duty story | Week 1 |

---

## 11. Monetization Path

**Phase 1 (Month 1-3): Free tool, build traffic**
- Zero monetization. Focus on SEO, word of mouth, trust.
- Track user count, most-searched tickers, bounce rate.

**Phase 2 (Month 3-6): Affiliate + Referral**
- Broker referral links: "Open a Ziidi account" → affiliate commission per signup
- DhowCSD referral for bond interest
- Non-intrusive, clearly disclosed

**Phase 3 (Month 6-12): Premium Features**
- Portfolio fee tracker (requires login → collect email)
- Custom alerts (price + fee notifications)
- API access for fintech developers
- Subscription: KES 99-299/month

**Phase 4 (Year 2): Platform Play**
- Become the "NerdWallet of Kenya" — compare all financial products (brokers, MMFs, SACCOs, insurance)
- Revenue: affiliate commissions + premium subscriptions + sponsored content (clearly labeled)

---

## 12. Open Questions

| # | Question | Impact | Status | Answer |
|:--|:--|:--|:--|:--|
| 1 | **Exact stamp duty calculation** — is it per trade or per settlement? If I buy SCOM at 10am and again at 2pm, is stamp duty charged on each trade or the combined settlement? | Changes the math for users who split orders | ✅ **CLOSED** | **Per trade.** Each individual trade execution triggers its own Sh2 stamp duty. Multiple buys in the same day each incur Sh2 separately. Confirmed by broker contract notes. |
| 2 | **Broker minimum fees** — does Ziidi have a minimum fee per trade? (Some brokers charge KES 100 minimum even if 1.12% would be less) | Changes calculations for very small trades | ✅ **CLOSED** | **Ziidi = zero minimum fee.** Confirmed by users making Sh50 test trades. Traditional brokers (e.g. Faida) may have KES 100 min — always check your broker's T&Cs. |
| 3 | **VAT on other levies** — is VAT (16%) charged only on brokerage, or also on NSE/CMA/CDSC levies? | ~0.1-0.2% difference in total fees | ✅ **CLOSED** | **VAT applies to brokerage only.** NSE/CMA/CDSC/ICF levies are not subject to VAT. Confirmed by actual Ziidi contract notes. |
| 4 | **CDSC fee on buy vs sell** — some sources suggest CDSC charges are different for buyer vs seller. Verify. | Minor impact | ✅ **CLOSED** | **Same rate on both sides.** CDSC charges 0.04% to both buyer and seller. |
| 5 | **Will stamp duty exemption for sub-Sh10K trades pass?** — Theo Capital lobbied Ruto. If it passes, we need to update immediately + write a blog post. | Major traffic opportunity | 🔄 **MONITOR** | Track in `dailyAnalysis.md` daily. If it passes: update fee logic immediately, publish a blog post, push to all channels. This could be a huge traffic moment. |
| 6 | **Stock price data source for auto-updates** — what's legal/free? NSE website ToS? | Blocks V2 auto-price-update feature | 🔄 **OPEN** | Research NSE data licensing. Check africanmarkets.com API pricing. For V1 this is irrelevant — update manually from daily BD market data. |

---

## Appendix A: Complete NSE Ticker List with Sectors

| Ticker | Company | Sector | Market |
|:--|:--|:--|:--|
| ABSA | Absa Bank Kenya PLC | Banking | MIMS |
| AMSC | Afri Mega Agricorp PLC | Agriculture | AIMS |
| ARM | ARM Cement PLC | Construction | MIMS |
| BAMB | Bamburi Cement PLC | Construction | MIMS |
| BAT | BAT Kenya PLC | Manufacturing | MIMS |
| BKG | BK Group PLC | Banking | MIMS |
| BOC | BOC Kenya PLC | Manufacturing | MIMS |
| BRIT | Britam Holdings PLC | Insurance | MIMS |
| CABL | EA Cables Ltd | Construction | MIMS |
| CARB | Carbacid Investments PLC | Manufacturing | MIMS |
| CG | Car & General (K) PLC | Automobiles | MIMS |
| CIC | CIC Insurance Group PLC | Insurance | MIMS |
| COOP | Co-operative Bank of Kenya PLC | Banking | MIMS |
| CTUM | Centum Investment Company PLC | Investment | MIMS |
| DCON | Deacons (East Africa) PLC | Commercial | MIMS |
| DTB | Diamond Trust Bank Kenya PLC | Banking | MIMS |
| EABL | East African Breweries PLC | Manufacturing | MIMS |
| EGAD | Eaagads Ltd | Agriculture | MIMS |
| EQTY | Equity Group Holdings PLC | Banking | MIMS |
| EVRD | Eveready East Africa PLC | Manufacturing | MIMS |
| FAHR | ILAM Fahari I-REIT | REIT | MIMS |
| FTGH | Flame Tree Group Holdings PLC | Manufacturing | MIMS |
| HAFR | Home Afrika PLC | Investment | MIMS |
| HF | HF Group PLC | Banking | MIMS |
| HMBZ | Homeboyz Entertainment PLC | Commercial | MIMS |
| JUB | Jubilee Holdings PLC | Insurance | MIMS |
| KAKZ | Kakuzi PLC | Agriculture | MIMS |
| KAPC | Kapchorua Tea Kenya PLC | Agriculture | MIMS |
| KCB | KCB Group PLC | Banking | MIMS |
| KEGN | KenGen PLC | Energy | MIMS |
| KPLC | Kenya Power & Lighting Co PLC | Energy | MIMS |
| KQ | Kenya Airways PLC | Commercial | MIMS |
| KRE | Kenya Reinsurance Corporation PLC | Insurance | MIMS |
| KURW | Kurwitu Ventures PLC | Investment | MIMS |
| LBTY | Liberty Kenya Holdings PLC | Insurance | MIMS |
| LMR | Limuru Tea Co PLC | Agriculture | MIMS |
| LNGH | Longhorn Publishers PLC | Commercial | MIMS |
| LTPT | Laptrust | Commercial | MIMS |
| MSC | Mumias Sugar Co PLC | Agriculture | MIMS |
| NBV | Nairobi Business Ventures Ltd | Commercial | GEMS |
| NCBA | NCBA Group PLC | Banking | MIMS |
| NGOLDETF | NewGold Issuer Ltd | ETF | MIMS |
| NMG | Nation Media Group PLC | Commercial | MIMS |
| NSE | Nairobi Securities Exchange PLC | Investment Services | MIMS |
| OLYM | Olympia Capital Holdings PLC | Investment | MIMS |
| PORT | East African Portland Cement PLC | Construction | MIMS |
| SASN | Sasini PLC | Agriculture | MIMS |
| SBIC | Stanbic Holdings PLC | Banking | MIMS |
| SCAN | ScanGroup PLC | Commercial | MIMS |
| SCBK | Standard Chartered Bank Kenya PLC | Banking | MIMS |
| SCOM | Safaricom PLC | Telecommunications | MIMS |
| SLAM | Sanlam Kenya PLC | Insurance | MIMS |
| SMIL | Sameer Africa PLC | Automobiles | MIMS |
| SNNA | Serena Hotels | Commercial | MIMS |
| STRS | Standard Group PLC | Commercial | MIMS |
| TOTL | TotalEnergies Marketing Kenya PLC | Energy | MIMS |
| TCL | Transcentury PLC | Investment | MIMS |
| UCHM | Uchumi Supermarkets PLC | Commercial | MIMS |
| UMME | Umeme Ltd | Energy | MIMS |
| UNGA | Unga Group PLC | Manufacturing | MIMS |
| WTK | Williamson Tea Kenya PLC | Agriculture | MIMS |

> **Note**: KPC (Kenya Pipeline) will be added upon listing (~March 2026).

---

*Document version: 1.1 | Created: 2026-02-19 | Last updated: 2026-02-19*
*v1.1 changes: Fixed Ziidi brokerage rate (1.12% → 1.50%), added broker dropdown replacing brokerage slider, added exact break-even iterative algorithm, added min fee logic to pseudocode, added Feature 5 (shareable card), added fee thermometer visual, moved PWA to V1, added Contract Note Analyzer to V2 roadmap, added per-ticker SEO pages, closed open questions 1–4, added URL params, updated data model.*
*Status: READY TO BUILD*
