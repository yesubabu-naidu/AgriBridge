import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import DownloadReceiptButton from '../../components/DownloadReceiptButton';
import { api } from '../../services/api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const data = await api.getOrders();
    setOrders(data);
    setLoading(false);
  };

  return (
    <div className="buyer-orders-page">
      <div className="mb-4">
        <span className="eyebrow">PURCHASE HISTORY</span>
        <h2 className="fw-black mb-1">My Orders</h2>
        <p className="text-muted small">Track your produce purchases and download official tax receipts.</p>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
      ) : orders.length === 0 ? (
        <EmptyState icon="bi-bag-x" title="No Orders Found" description="You haven't placed any produce orders yet." actionText="Explore Store" actionLink="/buyer/marketplace" />
      ) : (
        <div className="d-grid gap-4">
          {orders.map(order => (
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" key={order.id}>
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-3 border-bottom gap-2">
                <div>
                  <h6 className="fw-bold mb-0">Order #ORD-00{order.id}</h6>
                  <small className="text-muted">Placed on {new Date(order.created_at || Date.now()).toLocaleDateString('en-IN')}</small>
                </div>
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <StatusBadge status={order.order_status || 'delivered'} />
                  <span className="fw-bold text-success fs-5">₹{Number(order.grand_total || 5867.50).toLocaleString()}</span>
                  <DownloadReceiptButton orderId={order.id} label="Download Receipt" />
                </div>
              </div>

              <div className="mb-3">
                <span className="text-muted small d-block mb-1">Shipping Address:</span>
                <p className="small mb-0 text-dark">{order.shipping_address}</p>
              </div>

              <div className="p-3 bg-light rounded-3">
                <h6 className="fw-bold small mb-2">Order Items ({order.items ? order.items.length : 0})</h6>
                <div className="d-grid gap-2">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between small">
                      <span>{item.product_name} ({item.quantity} kg)</span>
                      <strong className="text-success">₹{Number(item.subtotal || item.unit_price * item.quantity).toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
