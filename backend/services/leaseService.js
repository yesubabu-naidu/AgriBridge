/**
 * AgriBridge Lease Service
 * Helper methods for lease pricing, duration calculations, and data consistency.
 */

export function calculateTotalLeaseAmount(annualPrice, durationMonths) {
  const annual = Number(annualPrice);
  const duration = durationMonths !== undefined && durationMonths !== null && durationMonths !== '' ? Number(durationMonths) : 12;
  if (!Number.isFinite(annual) || !Number.isFinite(duration) || annual <= 0 || duration <= 0) return 0;
  return Math.round((annual * (duration / 12)) * 100) / 100;
}

export function getLeaseDurationMonths(lease) {
  if (lease.proposed_duration_months != null && Number(lease.proposed_duration_months) > 0) {
    return Number(lease.proposed_duration_months);
  }
  if (lease.lease_duration_months != null && Number(lease.lease_duration_months) > 0) {
    return Number(lease.lease_duration_months);
  }
  if (lease.duration_months != null && Number(lease.duration_months) > 0) {
    return Number(lease.duration_months);
  }
  if (lease.start_date && lease.end_date) {
    const s = new Date(lease.start_date);
    const e = new Date(lease.end_date);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      const m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
      if (m > 0) return m;
    }
  }
  return 12;
}

export async function syncExistingLeaseAmounts(dbQuery) {
  try {
    const leases = await dbQuery(`
      SELECT les.id, les.annual_price, les.start_date, les.end_date, les.payment_status,
             COALESCE(app.proposed_duration_months, l.lease_duration_months, 12) AS duration_months
      FROM leases les
      JOIN lands l ON les.land_id = l.id
      LEFT JOIN lease_applications app ON les.application_id = app.id
    `);

    for (const lease of leases) {
      const duration = getLeaseDurationMonths(lease);
      const annual = Number(lease.annual_price);
      const correctTotal = calculateTotalLeaseAmount(annual, duration);

      if (lease.payment_status === 'paid' && correctTotal > 0 && correctTotal !== annual) {
        const txs = await dbQuery(`
          SELECT id, amount FROM transactions
          WHERE (reference_id = ? OR reference_id = ?) AND type = 'lease_payment'
        `, [`LEASE-${lease.id}`, String(lease.id)]);

        for (const tx of txs) {
          if (Number(tx.amount) === annual) {
            await dbQuery(`UPDATE transactions SET amount = ? WHERE id = ?`, [correctTotal, tx.id]);
          }
        }

        const payments = await dbQuery(`
          SELECT id, amount FROM payments
          WHERE reference_type = 'lease' AND reference_id = ?
        `, [lease.id]);

        for (const p of payments) {
          if (Number(p.amount) === annual) {
            await dbQuery(`UPDATE payments SET amount = ? WHERE id = ?`, [correctTotal, p.id]);
          }
        }
      }
    }
  } catch (err) {
    console.error('Lease amount synchronization check note:', err.message);
  }
}
