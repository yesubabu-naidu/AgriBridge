import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { api } from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const data = await api.getDashboardStats('admin');
    setStats(data);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-success"></div></div>;

  return (
    <div className="admin-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <span className="eyebrow">SYSTEM CONTROL</span>
          <h2 className="fw-black mb-1">Admin Operations Center 🛡️</h2>
          <p className="text-muted small">Monitor platform-wide users, land moderation, transactions, and system health.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-6">
          <StatCard title="Total Registered Users" value={stats.total_users} icon="bi-people" color="primary" />
        </div>
        <div className="col-lg-3 col-md-6">
          <StatCard title="Total Farmland Listings" value={stats.total_lands} icon="bi-map" color="success" />
        </div>
        <div className="col-lg-3 col-md-6">
          <StatCard title="Total Platform Revenue" value={`₹${Number(stats.total_revenue).toLocaleString()}`} icon="bi-bank" color="info" />
        </div>
        <div className="col-lg-3 col-md-6">
          <StatCard title="Total System Orders" value={stats.total_orders} icon="bi-bag-check" color="warning" />
        </div>
      </div>

      {/* User Demographics Breakdown */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white text-center">
            <h6 className="text-muted small fw-bold">Farmers</h6>
            <h2 className="fw-black text-success">{stats.total_farmers}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white text-center">
            <h6 className="text-muted small fw-bold">Landowners</h6>
            <h2 className="fw-black text-primary">{stats.total_landowners}</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white text-center">
            <h6 className="text-muted small fw-bold">Produce Buyers</h6>
            <h2 className="fw-black text-warning">{stats.total_buyers}</h2>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="row g-3">
        <div className="col-md-4">
          <Link to="/admin/users" className="card border-0 shadow-sm rounded-4 p-4 bg-white text-decoration-none h-100 hover-lift">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary-subtle text-primary p-3 rounded-3"><i className="bi bi-people fs-3"></i></div>
              <div>
                <h6 className="fw-bold text-dark mb-1">User Management</h6>
                <small className="text-muted">Manage roles, suspend users, verify accounts</small>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-4">
          <Link to="/admin/lands" className="card border-0 shadow-sm rounded-4 p-4 bg-white text-decoration-none h-100 hover-lift">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-success-subtle text-success p-3 rounded-3"><i className="bi bi-patch-check fs-3"></i></div>
              <div>
                <h6 className="fw-bold text-dark mb-1">Land Moderation</h6>
                <small className="text-muted">Approve, reject, and review land listings</small>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-4">
          <Link to="/admin/transactions" className="card border-0 shadow-sm rounded-4 p-4 bg-white text-decoration-none h-100 hover-lift">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-info-subtle text-info p-3 rounded-3"><i className="bi bi-receipt fs-3"></i></div>
              <div>
                <h6 className="fw-bold text-dark mb-1">Platform Audit Log</h6>
                <small className="text-muted">Audit all lease and purchase payments</small>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
