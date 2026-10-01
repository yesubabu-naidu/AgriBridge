import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { api } from '../services/api';

export default function Earnings() {
  const [payouts, setPayouts] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    setLoading(true);
    try {
      const response = await api.getLandownerEarnings();
      const payload = response?.data || response || {};
      const transactions = Array.isArray(payload.transactions) ? payload.transactions : [];
      setPayouts(transactions);
      setTotalEarnings(Number(payload.total_earnings || 0));
      setPendingEarnings(Number(payload.pending_payments ?? payload.pending_earnings ?? 0));
      setCompletedCount(Number(payload.completed_payouts ?? transactions.length));
    } catch (err) {
      console.error('Failed to load landowner earnings:', err);
      setPayouts([]);
      setTotalEarnings(0);
      setPendingEarnings(0);
      setCompletedCount(0);
    }
    setLoading(false);
  };

  return (
    <div className="earnings-page">
      <div className="mb-4">
        <span className="eyebrow">FINANCIAL OVERVIEW</span>
        <h2 className="fw-black mb-1">Landowner Earnings & Payouts</h2>
        <p className="text-muted small">Track lease income, payouts, and real-time financial metrics.</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <StatCard title="Total Cumulative Earnings" value={`₹${totalEarnings.toLocaleString()}`} icon="bi-wallet2" color="success" />
        </div>
        <div className="col-md-4">
          <StatCard title="Pending Lease Payments" value={`₹${pendingEarnings.toLocaleString()}`} icon="bi-hourglass-split" color="warning" />
        </div>
        <div className="col-md-4">
          <StatCard title="Completed Payouts" value={completedCount} icon="bi-check-circle" color="primary" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
      ) : payouts.length === 0 ? (
        <EmptyState
          icon="bi-wallet2"
          title="No Earnings or Payout Records Yet"
          description="When tenant farmers complete lease payments for your land listings, your financial earnings log will populate automatically here."
        />
      ) : (
        <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
          <h5 className="fw-bold mb-3">Earnings Log</h5>
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Payout Ref</th>
                  <th>Description</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map(p => (
                  <tr key={p.id}>
                    <td className="fw-bold font-monospace">{p.transaction_id || `PAY-${p.id}`}</td>
                    <td>{p.description || 'Land Lease Rent Payment'}</td>
                    <td>{p.payment_method || 'UPI / Bank Transfer'}</td>
                    <td className="fw-bold text-success">₹{Number(p.amount).toLocaleString()}</td>
                    <td className="small text-muted">{p.created_at || new Date().toISOString().split('T')[0]}</td>
                    <td><StatusBadge status={p.status || 'successful'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
