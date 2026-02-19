// Spec regression tests — run with: node test.mjs
// Validates the 4 worked examples from docs/nse-fee-calculator-spec.md § 6

import { calculateTrade, calculateSweetSpot } from './js/calculator.js';

const TOLERANCE = 0.02;
let pass = 0, fail = 0;

function check(label, got, expected, tol = TOLERANCE) {
  const ok = Math.abs(got - expected) < tol;
  if (ok) {
    console.log('  OK  ' + label + '  ->  ' + got);
    pass++;
  } else {
    console.log('  XX  ' + label + '  ->  got=' + got + '  expected=' + expected);
    fail++;
  }
  return ok;
}

console.log('='.repeat(60));
console.log('NSE FEE CALCULATOR -- REGRESSION TESTS');
console.log('='.repeat(60));

// ──────────────────────────────────────────────────────────
// Spec § 6 worked examples  (all use 1.12% brokerage, minFee=0)
// ──────────────────────────────────────────────────────────

console.log('\nEx1: Buy 1 ABSA @ KES 30.20  (rate=1.12%)\n');
let r = calculateTrade('buy', 30.20, 1, 0.0112, 0);
check('totalFees',     r.totalFees,     2.47);
check('feePercentage', r.feePercentage, 8.18);
check('totalAmount',   r.totalAmount,   32.67);
console.log('  breakdown: ' + JSON.stringify({
  consideration: r.consideration, brokerage: r.brokerage,
  vat: r.vatOnBrokerage, nse: r.nseLevy, cma: r.cmaLevy,
  cdsc: r.cdscFee, icf: r.icfLevy, stamp: r.stampDuty
}));

console.log('\nEx2: Buy 10 SCOM @ KES 33.85  (rate=1.12%)\n');
r = calculateTrade('buy', 33.85, 10, 0.0112, 0);
check('totalFees',     r.totalFees,     7.38);
check('feePercentage', r.feePercentage, 2.18);
check('totalAmount',   r.totalAmount,   345.88);
console.log('  breakdown: ' + JSON.stringify({
  consideration: r.consideration, brokerage: r.brokerage,
  vat: r.vatOnBrokerage, nse: r.nseLevy, cma: r.cmaLevy,
  cdsc: r.cdscFee, icf: r.icfLevy, stamp: r.stampDuty
}));

console.log('\nEx3: Buy 5 EQTY @ KES 74.75  (rate=1.12%)\n');
r = calculateTrade('buy', 74.75, 5, 0.0112, 0);
check('totalFees',     r.totalFees,     7.95);
check('feePercentage', r.feePercentage, 2.13);
check('totalAmount',   r.totalAmount,   381.70);
console.log('  breakdown: ' + JSON.stringify({
  consideration: r.consideration, brokerage: r.brokerage,
  vat: r.vatOnBrokerage, nse: r.nseLevy, cma: r.cmaLevy,
  cdsc: r.cdscFee, icf: r.icfLevy, stamp: r.stampDuty
}));

console.log('\nEx4: Sell 100 KCB @ KES 75.00  (rate=1.12%)\n');
r = calculateTrade('sell', 75.00, 100, 0.0112, 0);
check('totalFees',     r.totalFees,     121.19);
check('feePercentage', r.feePercentage, 1.62);
check('totalAmount',   r.totalAmount,   7378.81);
console.log('  breakdown: ' + JSON.stringify({
  consideration: r.consideration, brokerage: r.brokerage,
  vat: r.vatOnBrokerage, nse: r.nseLevy, cma: r.cmaLevy,
  cdsc: r.cdscFee, icf: r.icfLevy, stamp: r.stampDuty
}));

// ──────────────────────────────────────────────────────────
// Edge cases
// ──────────────────────────────────────────────────────────
console.log('\nEdge Cases:\n');

// Minimum fee trigger — Faida: 10xSCOM @ 33.85, rate=1.25%, min=100
// 10 × 33.85 × 0.0125 = 4.23 which is below KES 100 minimum
r = calculateTrade('buy', 33.85, 10, 0.0125, 100);
if (r.minFeeApplied === true && r.brokerage === 100) {
  console.log('  OK  minFee applied  ->  brokerage=' + r.brokerage + ' minFeeApplied=' + r.minFeeApplied);
  pass++;
} else {
  console.log('  XX  minFee  ->  brokerage=' + r.brokerage + ' minFeeApplied=' + r.minFeeApplied + '  (expected brokerage=100, true)');
  fail++;
}

// Stamp duty bracket boundary tests
r = calculateTrade('buy', 9999.99, 1, 0.0150, 0);
check('stampDuty @ consideration=9999.99',  r.stampDuty, 2, 0.001);

r = calculateTrade('buy', 10000.00, 1, 0.0150, 0);
check('stampDuty @ consideration=10000.00', r.stampDuty, 2, 0.001);

r = calculateTrade('buy', 10000.01, 1, 0.0150, 0);
check('stampDuty @ consideration=10000.01', r.stampDuty, 4, 0.001);

// sweetSpotQty uses FLOOR: FLOOR(10000/33.85) = 295, not CEIL (296)
const sweet = calculateSweetSpot(33.85);
check('sweetSpotQty(33.85) = FLOOR = 295', sweet, 295, 0.001);

// Confirm qty=296 @ 33.85 pushes consideration to 10019.60 → 2nd bracket → KES 4
r = calculateTrade('buy', 33.85, 296, 0.0150, 0);
check('qty=296 crosses 10k bracket (stampDuty=4)', r.stampDuty, 4, 0.001);

// ──────────────────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(60));
const total = pass + fail;
console.log('RESULT: ' + pass + '/' + total + ' passed' + (fail > 0 ? '  --  ' + fail + ' FAILED' : '  -- ALL PASS'));
console.log('='.repeat(60));
process.exit(fail > 0 ? 1 : 0);
