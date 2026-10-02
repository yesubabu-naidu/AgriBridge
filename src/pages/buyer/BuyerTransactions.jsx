import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import DownloadReceiptButton from '../../components/DownloadReceiptButton';
import { api } from '../../services/api';

export default function BuyerTransactions() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    const data = await api.getTransactions();
    setTxs(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  return (
    <div className="buyer-transactions-page">
      <div className="mb-4">
        <span className="eyebrow">BUYER PAYMENTS</span>
        <h2 className="fw-black mb-1">Transaction History</h2>
        <p className="text-muted small">View checkout payment history and download official tax invoices.</p>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
      ) : txs.length === 0 ? (
        <EmptyState icon="bi-receipt" title="No Transactions" description="You have no recorded payments." />
      ) : (
        <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Transaction ID</th>
                  <th>Description</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {txs.map(tx => (
                  <tr key={tx.id}>
                    <td className="fw-bold font-monospace">{tx.transaction_id}</td>
                    <td>{tx.description}</td>
                    <td>{tx.payment_method}</td>
                    <td className="fw-bold text-success">₹{Number(tx.amount).toLocaleString()}</td>
                    <td><StatusBadge status={tx.status} /></td>
                    <td className="small text-muted">{new Date(tx.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <DownloadReceiptButton transactionId={tx.transaction_id || tx.id} label="Receipt" />
                    </td>
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
