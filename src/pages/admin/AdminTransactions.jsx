import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/StatusBadge';
import { api } from '../../services/api';

export default function AdminTransactions() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    const data = await api.getTransactions();
    setTxs(data);
    setLoading(false);
  };

  return (
    <div className="admin-transactions-page">
      <div className="mb-4">
        <span className="eyebrow">SYSTEM AUDIT LOG</span>
        <h2 className="fw-black mb-1">Global Transactions</h2>
        <p className="text-muted small">System-wide audit trail of lease payments and produce marketplace checkouts.</p>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Tx ID</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {txs.map(tx => (
                  <tr key={tx.id}>
                    <td className="fw-bold font-monospace">{tx.transaction_id}</td>
                    <td><span className="badge bg-light text-dark border text-capitalize">{tx.type ? tx.type.replace('_', ' ') : 'payment'}</span></td>
                    <td>{tx.description}</td>
                    <td className="fw-bold text-success">₹{Number(tx.amount).toLocaleString()}</td>
                    <td>{tx.payment_method}</td>
                    <td><StatusBadge status={tx.status} /></td>
                    <td className="small text-muted">{tx.created_at}</td>
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
