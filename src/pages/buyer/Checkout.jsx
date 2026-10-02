import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState('12 Agritech Park, MG Road, Vijayawada, AP 520002');

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const data = await api.getCart();
    setCart(Array.isArray(data) ? data : []);
  };

  const [stockError, setStockError] = useState(null);
  const [validating, setValidating] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price_per_unit) || 0) * (Number(item.quantity) || 0), 0);

  const handleNext = async (e) => {
    e.preventDefault();
    if (validating) return;
    if (!cart.length) {
      setStockError('Your cart is empty.');
      return;
    }

    setValidating(true);
    setStockError(null);
    try {
      const check = await api.validateCartStock();
      if (!check?.success) {
        setStockError(check?.message || 'One or more items exceed available stock.');
        setValidating(false);
        return;
      }
      navigate('/buyer/payment', { state: { address, totalAmount: subtotal, items: cart } });
    } catch (err) {
      setStockError('Unable to verify available inventory. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="checkout-page py-5">
      <div className="container">
        <div className="mb-4">
          <span className="eyebrow">CHECKOUT — STEP 1 OF 2</span>
          <h2 className="fw-black mb-1">Shipping & Delivery Details</h2>
          <p className="text-muted small">Enter your commercial shipping address and confirm your produce order.</p>
        </div>

        {stockError && (
          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            <div className="fw-semibold">{stockError}</div>
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold mb-3">Delivery Address</h5>
              <form onSubmit={handleNext}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Full Address *</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    required 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  ></textarea>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">City / District *</label>
                    <input type="text" className="form-control" defaultValue="Vijayawada" required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Pincode *</label>
                    <input type="text" className="form-control" defaultValue="520002" required />
                  </div>
                </div>

                <button type="submit" className="btn btn-success btn-lg px-4 fw-bold">
                  Continue to Payment <i className="bi bi-arrow-right ms-1"></i>
                </button>
              </form>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold mb-3">Items in Order</h5>
              <div className="d-grid gap-2 mb-3">
                {cart.map(item => (
                  <div key={item.cart_id} className="d-flex justify-content-between align-items-center p-2 bg-light rounded-3">
                    <div>
                      <strong className="d-block small">{item.product_name}</strong>
                      <small className="text-muted">{item.quantity} {item.unit} × ₹{item.price_per_unit}</small>
                    </div>
                    <span className="fw-bold text-success">₹{(item.price_per_unit * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-between border-top pt-3">
                <span className="fw-bold">Subtotal</span>
                <span className="price-tag fs-4">₹{subtotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
