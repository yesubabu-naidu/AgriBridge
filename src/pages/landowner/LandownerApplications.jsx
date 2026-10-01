import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { api } from '../../services/api';

export default function LandownerApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    const data = await api.getLandownerApplications();
    setApplications(data);
    setLoading(false);
  };

  const handleAction = async (id, status) => {
    await api.updateApplicationStatus(id, status);
    loadApplications();
  };

  return (
    <div className="landowner-applications-page">
      <div className="mb-4">
        <span className="eyebrow">LEASE REQUESTS</span>
        <h2 className="fw-black mb-1">Lease Applications</h2>
        <p className="text-muted small">Review incoming farmer applications, proposed pricing, and approve leases.</p>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
      ) : applications.length === 0 ? (
        <EmptyState icon="bi-file-earmark-text" title="No Applications Received" description="You currently have no incoming lease applications." />
      ) : (
        <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Farmer</th>
                  <th>Land Property</th>
                  <th>Proposed Price</th>
                  <th>Duration</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td>
                      <div className="fw-bold">{app.farmer_name || 'Ramesh Babu'}</div>
                      <small className="text-muted">{app.farmer_email || 'farmer@agribridge.com'}</small>
                    </td>
                    <td>{app.land_name || 'Green Valley Farm'}</td>
                    <td>
                      <div className="fw-bold text-success">₹{Number(app.proposed_price || 40000).toLocaleString()}/year</div>
                      <small className="text-muted d-block">
                        Total Lease Value: ₹{(Math.round((Number(app.proposed_price || 40000) * ((Number(app.proposed_duration_months) || 12) / 12)) * 100) / 100).toLocaleString()}
                      </small>
                    </td>
                    <td>{app.proposed_duration_months || 12} Months</td>
                    <td className="small text-muted" style={{ maxWidth: '240px' }}>{app.message || 'Intends organic crop cultivation'}</td>
                    <td><StatusBadge status={app.status} /></td>
                    <td>
                      {app.status === 'pending' ? (
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-success px-3" onClick={() => handleAction(app.id, 'approved')}>
                            Accept
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleAction(app.id, 'rejected')}>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted small">Processed</span>
                      )}
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
