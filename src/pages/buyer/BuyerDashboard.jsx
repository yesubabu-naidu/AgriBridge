import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import ProductCard from '../../components/ProductCard';
import StatusBadge from '../../components/StatusBadge';
import DownloadReceiptButton from '../../components/DownloadReceiptButton';
import { api } from '../../services/api';

export default function BuyerDashboard({ user: propUser }) {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = propUser || (() => {
    try { return JSON.parse(localStorage.getItem('agribridge_user') || 'null'); } catch { return null; }
  })();
  const displayName = currentUser?.full_name?.trim() || 'User';

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    const data = await api.getDashboardStats('buyer');
    const prods = await api.getProducts();
    setStats(data);
    setProducts(Array.isArray(prods) ? prods : []);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-success"></div></div>;

  return (
    <div className="buyer-dashboard">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-4 gap-3">
        <div>
          <span className="eyebrow">BUYER WORKSPACE</span>
          <h2 className="fw-black mb-1 fs-3 fs-sm-2">Welcome, {displayName}! 🌾</h2>
          <p className="text-muted small mb-0">Browse farm produce, manage orders, and track deliveries.</p>
        </div>
        <Link to="/buyer/marketplace" className="btn btn-success w-100 w-sm-auto text-center">
          <i className="bi bi-shop me-1"></i> Produce Store
        </Link>
      </div>

      {/* Stats */}
      <div className="row g-2 g-sm-3 mb-4">
        <div className="col-6 col-lg-3">
          <StatCard title="Total Orders" value={stats.total_orders} icon="bi-bag-check" color="primary" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Completed Orders" value={stats.completed_orders} icon="bi-check-circle" color="success" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Pending Orders" value={stats.pending_orders} icon="bi-hourglass-split" color="warning" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Total Spending" value={`₹${Number(stats.total_spending).toLocaleString()}`} icon="bi-wallet2" color="info" />
        </div>
      </div>

      {/* Recommended Produce */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Recommended Direct-from-Farm Produce</h5>
          <Link to="/buyer/marketplace" className="btn btn-sm btn-light-green">View Store</Link>
        </div>
        <div className="row g-3">
          {products.map(p => (
            <div className="col-md-6" key={p.id}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0">Recent Orders</h5>
          <Link to="/buyer/orders" className="btn btn-sm btn-light-green">All Orders</Link>
        </div>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr className="text-muted small">
                <th>Order Ref</th>
                <th>Grand Total</th>
                <th>Payment Method</th>
                <th>Order Status</th>
                <th>Date</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recent_orders || []).map(o => (
                <tr key={o.id}>
                  <td className="fw-bold font-monospace">ORD-00{o.id}</td>
                  <td className="fw-bold text-success">₹{Number(o.grand_total || 5867.50).toLocaleString()}</td>
                  <td>{o.payment_method || 'UPI'}</td>
                  <td><StatusBadge status={o.order_status || 'delivered'} /></td>
                  <td className="small text-muted">{o.created_at || '2026-08-28'}</td>
                  <td className="text-end">
                    <DownloadReceiptButton 
                      orderId={o.id}
                      className="btn-outline-success btn-sm py-1 px-2"
                      label="Receipt"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
