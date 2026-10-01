import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { api } from '../../services/api';

export default function Leases() {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeases();
  }, []);

  const loadLeases = async () => {
    setLoading(true);
    const data = await api.getFarmerLeases();
    setLeases(data);
    setLoading(false);
  };

  return (
    <div className="farmer-leases-page">
      <div className="mb-4">
        <span className="eyebrow">MY LEASE AGREEMENTS</span>
        <h2 className="fw-black mb-1">Current Leases</h2>
        <p className="text-muted small">View active land leases, start/end dates, and make lease fee payments.</p>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
      ) : leases.length === 0 ? (
        <EmptyState
          icon="bi-journal-check"
          title="No Active Leases"
          description="You don't have any approved land leases. Browse the land marketplace to submit lease applications."
          actionText="Browse Lands"
          actionLink="/marketplace"
        />
      ) : (
        <div className="row g-4">
          {leases.map(lease => {
            const duration = Number(lease.lease_duration_months || lease.proposed_duration_months || 12);
            const annualPrice = Number(lease.annual_price || 0);
            const totalAmount = Number(lease.total_amount ?? lease.total_lease_amount) || Math.round((annualPrice * (duration / 12)) * 100) / 100;

            return (
              <div className="col-lg-6" key={lease.id}>
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="fw-bold mb-1">{lease.land_name}</h5>
                      <span className="text-muted small"><i className="bi bi-geo-alt me-1"></i>{lease.location}</span>
                    </div>
                    <StatusBadge status={lease.payment_status === 'paid' ? 'paid' : 'pending'} />
                  </div>

                  <div className="row g-2 p-3 bg-light rounded-3 mb-3 small">
                    <div className="col-6">
                      <span className="text-muted d-block">Landowner</span>
                      <strong>{lease.owner_name}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Lease Fee</span>
                      <strong className="text-success">₹{annualPrice.toLocaleString()}/yr</strong>
                      <small className="text-muted d-block">({duration} Mo · Total: ₹{totalAmount.toLocaleString()})</small>
                    </div>
                    <div className="col-6 mt-2">
                      <span className="text-muted d-block">Start Date</span>
                      <span>{lease.start_date ? new Date(lease.start_date).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="col-6 mt-2">
                      <span className="text-muted d-block">End Date</span>
                      <span>{lease.end_date ? new Date(lease.end_date).toLocaleDateString() : '-'}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-2">
                    {lease.payment_status === 'pending' ? (
                      <Link to={`/farmer/payment/${lease.id}`} className="btn btn-success w-100 fw-bold">
                        <i className="bi bi-credit-card me-2"></i> Make Payment (₹{totalAmount.toLocaleString()})
                      </Link>
                    ) : (
                      <div className="p-2 bg-success-subtle text-success text-center rounded-3 small fw-bold">
                        <i className="bi bi-check-circle-fill me-1"></i> Lease Fee Fully Paid (₹{totalAmount.toLocaleString()})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
