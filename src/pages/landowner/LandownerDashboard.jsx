import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { api } from '../../services/api';

export default function LandownerDashboard({ user: propUser }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUser = propUser || (() => {
    try { return JSON.parse(localStorage.getItem('agribridge_user') || 'null'); } catch { return null; }
  })();
  const displayName = currentUser?.full_name?.trim() || 'User';

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const data = await api.getDashboardStats('landowner');
    setStats(data);
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-success"></div></div>;
  }

  return (
    <div className="landowner-dashboard">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3">
        <div>
          <span className="eyebrow">LANDOWNER WORKSPACE</span>
          <h2 className="fw-black mb-1 fs-3 fs-sm-2">Welcome, {displayName}! 🌾</h2>
          <p className="text-muted small mb-0">Manage agricultural land listings and review lease applications.</p>
        </div>
        <Link to="/landowner/add-land" className="btn btn-success w-100 w-sm-auto text-center">
          <i className="bi bi-plus-lg me-1"></i> Add New Land
        </Link>
      </div>

      {/* Stats */}
      <div className="row g-2 g-sm-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard title="Total Lands" value={stats.total_lands} icon="bi-map" color="primary" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Total Earnings" value={`₹${Number(stats.total_earnings).toLocaleString()}`} icon="bi-wallet2" color="success" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Pending Apps" value={stats.pending_applications} icon="bi-hourglass-split" color="warning" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Active Leases" value={stats.active_leases} icon="bi-check-circle" color="info" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Recent Lease Applications</h5>
          <Link to="/landowner/applications" className="btn btn-sm btn-light-green">View All</Link>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr className="text-muted small">
                <th>Farmer</th>
                <th>Land Name</th>
                <th>Proposed Price</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recent_applications || []).map(app => {
                const duration = Number(app.proposed_duration_months || 12);
                const annualPrice = Number(app.proposed_price || 40000);
                const totalLeaseValue = Math.round((annualPrice * (duration / 12)) * 100) / 100;
                return (
                  <tr key={app.id}>
                    <td>
                      <div className="fw-bold">{app.farmer_name || 'Ramesh Babu'}</div>
                    </td>
                    <td>{app.land_name || 'Green Valley Farm'}</td>
                    <td>
                      <div className="fw-bold">₹{annualPrice.toLocaleString()}/yr</div>
                      <small className="text-muted d-block">Total Lease Value: ₹{totalLeaseValue.toLocaleString()}</small>
                    </td>
                    <td>{duration} Months</td>
                    <td><StatusBadge status={app.status} /></td>
                    <td>
                      <Link to="/landowner/applications" className="btn btn-sm btn-outline-success">
                        Review
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
