import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import LandCard from '../../components/LandCard';
import StatusBadge from '../../components/StatusBadge';
import AgriAIChatbot from '../../components/AgriAIChatbot';
import { api } from '../../services/api';

export default function FarmerDashboard() {
  const [stats, setStats] = useState(null);
  const [recommendedLands, setRecommendedLands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const data = await api.getDashboardStats('farmer');
    const lands = await api.getLands();
    setStats(data);
    setRecommendedLands(lands.slice(0, 2));
    setLoading(false);
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-success"></div></div>;

  return (
    <div className="farmer-dashboard px-1 px-sm-2 px-md-3">
      {/* Header Bar */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3">
        <div>
          <span className="eyebrow text-uppercase text-muted extra-small d-block mb-1">FARMER WORKSPACE</span>
          <h2 className="fw-black mb-1 text-success fs-3 fs-sm-2">Welcome, Farmer! 🌾</h2>
          <p className="text-muted small mb-0">Manage your active leases, pending applications, and smart farming tools.</p>
        </div>
        <Link to="/marketplace" className="btn btn-success w-100 w-sm-auto text-center">
          <i className="bi bi-search me-1"></i> Browse Farmlands
        </Link>
      </div>

      {/* Responsive 4-Stat Grid (2x2 on Mobile, 4x1 on Desktop) */}
      <div className="row g-2 g-sm-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard title="Active Leases" value={stats.total_leases} icon="bi-journal-check" color="success" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Pending Apps" value={stats.pending_applications} icon="bi-hourglass-split" color="warning" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Approved Apps" value={stats.approved_applications} icon="bi-check-circle" color="info" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Total Spending" value={`₹${Number(stats.total_spending).toLocaleString()}`} icon="bi-currency-rupee" color="primary" />
        </div>
      </div>

      {/* 7-Day AI Weather Forecast Quick Banner */}
      <div className="card border-0 shadow-sm mb-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b4128 0%, #157347 100%)', color: 'white', borderRadius: '16px' }}>
        <div className="card-body p-3 p-sm-4 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div className="w-100">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <span className="badge bg-warning text-dark fw-bold text-uppercase">🌤️ AGRI-AI METEOROLOGY</span>
              <span className="extra-small text-white-50">Live 7-Day Satellite Microclimate Forecast</span>
            </div>
            <h4 className="fw-black mb-1 text-white fs-4 fs-sm-3">7-Day AI Agricultural Weather Forecast</h4>
            <p className="text-white-50 small mb-0">Get real-time precipitation, temperature, humidity, and AI advisories for irrigation, spraying, and harvesting.</p>
          </div>
          <Link to="/farmer/weather" className="btn btn-warning text-dark fw-bold px-4 py-2 w-100 w-md-auto text-center">
            <i className="bi bi-cloud-sun me-1"></i> View Forecast
          </Link>
        </div>
      </div>

      {/* Smart Irrigation Quick Launch Banner */}
      <div className="card bg-success text-white border-0 shadow-sm mb-4 overflow-hidden position-relative" style={{ borderRadius: '16px' }}>
        <div className="card-body p-3 p-sm-4 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div className="w-100">
            <span className="badge bg-white text-success fw-bold text-uppercase mb-2">💧 AGRIBRAIN PRECISION MODULE</span>
            <h4 className="fw-black mb-1 text-white fs-4 fs-sm-3">Smart Irrigation Recommendation Engine</h4>
            <p className="text-white-50 small mb-0">Get AI evapotranspiration advisories, soil moisture tracking, and water saving recommendations.</p>
          </div>
          <Link to="/farmer/irrigation" className="btn btn-light text-success fw-bold px-4 py-2 w-100 w-md-auto text-center">
            Launch Engine <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </div>
      </div>

      {/* Recommended Farmlands */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Recommended Farmlands for Lease</h5>
          <Link to="/marketplace" className="btn btn-sm btn-light-green">Explore All</Link>
        </div>
        <div className="row g-3">
          {recommendedLands.map(land => (
            <div className="col-12 col-md-6" key={land.id}>
              <LandCard land={land} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card border-0 shadow-sm rounded-4 p-3 p-sm-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Recent Payment Transactions</h5>
          <Link to="/farmer/transactions" className="btn btn-sm btn-light-green">View History</Link>
        </div>
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr className="text-muted small">
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recent_transactions || []).map(tx => (
                <tr key={tx.id}>
                  <td className="fw-bold font-monospace extra-small">{tx.transaction_id}</td>
                  <td className="text-capitalize extra-small">{tx.type.replace('_', ' ')}</td>
                  <td className="fw-bold text-success extra-small">₹{Number(tx.amount).toLocaleString()}</td>
                  <td className="extra-small">{tx.payment_method}</td>
                  <td><StatusBadge status={tx.status} /></td>
                  <td className="extra-small text-muted">{tx.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating AI Agriculture Chatbot Assistant */}
      <AgriAIChatbot />
    </div>
  );
}
