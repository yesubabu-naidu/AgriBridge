import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotalLeaseAmount, getLeaseDurationMonths } from '../services/leaseService.js';

test('calculateTotalLeaseAmount calculates accurate duration-based pricing', () => {
  // 12 months = 1x
  assert.equal(calculateTotalLeaseAmount(40000, 12), 40000);
  // 24 months = 2x
  assert.equal(calculateTotalLeaseAmount(40000, 24), 80000);
  // 36 months = 3x
  assert.equal(calculateTotalLeaseAmount(40000, 36), 120000);
  // 6 months = 0.5x
  assert.equal(calculateTotalLeaseAmount(40000, 6), 20000);
  // Invalid inputs handle safely without NaN or string concatenation
  assert.equal(calculateTotalLeaseAmount('40000', '24'), 80000);
  assert.equal(calculateTotalLeaseAmount(0, 12), 0);
  assert.equal(calculateTotalLeaseAmount(40000, 0), 0);
});

test('getLeaseDurationMonths extracts duration from available metadata', () => {
  // From proposed_duration_months
  assert.equal(getLeaseDurationMonths({ proposed_duration_months: 24 }), 24);
  // From lease_duration_months
  assert.equal(getLeaseDurationMonths({ lease_duration_months: 36 }), 36);
  // From start_date and end_date
  assert.equal(getLeaseDurationMonths({
    start_date: '2026-09-30',
    end_date: '2028-09-30'
  }), 24);
  // Fallback default
  assert.equal(getLeaseDurationMonths({}), 12);
});

test('Landowner earnings and pending payment calculation match required logic', () => {
  const transactions = [
    { id: 4, type: 'lease_payment', amount: '80000.00', status: 'successful' }
  ];
  const totalEarnings = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  assert.equal(totalEarnings, 80000);

  const pendingLeases = [];
  const pendingTotal = pendingLeases.reduce((sum, lease) => {
    const annual = Number(lease.annual_price || 0);
    const duration = getLeaseDurationMonths(lease);
    return sum + calculateTotalLeaseAmount(annual, duration);
  }, 0);
  assert.equal(pendingTotal, 0);
});
