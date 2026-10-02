import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function BuyerPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const address = state.address || '12 Agritech Park, MG Road, Vijayawada, AP 520002';
  const totalAmount = state.totalAmount || 5350;
  const items = state.items || [];

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const deliveryFee = 150;
  const platformFee = 50;
  const grandTotal = totalAmount + deliveryFee + platformFee;

  const handlePay = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.makeBuyerPayment({
        items,
        totalAmount,
        shippingAddress: address,
        paymentMethod
      });

      if (!res?.success) {
        setError(res?.message || "Unable to complete the crop purchase.");
        setSubmitting(false);
        return;
      }

      window.dispatchEvent(new CustomEvent('agribridge:cart-updated'));

      navigate('/payment/success', {
        state: {
          transaction_id: res.transaction?.transaction_id || `AGRI${Date.now()}`,
          amount: grandTotal,
          role: 'buyer'
        }
      });
    } catch (err) {
      console.error('Payment failed:', err);
      setError(err?.message || "Something went wrong while processing your payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="buyer-payment-page py-5">
      <div className="container">
        <div className="mb-4">
          <span className="eyebrow">CHECKOUT — STEP 2 OF 2</span>
          <h2 className="fw-black mb-1">Produce Checkout Payment</h2>
          <p className="text-muted small">Choose your payment mode to authorize produce shipment.</p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            <div className="fw-semibold">{error}</div>
          </div>
        )}

        <div className="payment-layout">
          <div>
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
              <h5 className="fw-bold mb-3">Select Payment Method</h5>

              {[
                ['UPI', 'Instant UPI Payment (GPay / PhonePe / Paytm)', 'bi-qr-code-scan'],
                ['Card', 'Credit / Debit Card', 'bi-credit-card-2-front'],
                ['Net Banking', 'Net Banking', 'bi-bank'],
                ['COD', 'Cash on Delivery (COD)', 'bi-cash-stack']
              ].map(([id, label, icon]) => (
                <div 
                  key={id}
                  className={`payment-method-card d-flex align-items-center gap-3 ${paymentMethod === id ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod(id)}
                >
                  <input type="radio" name="buyer_payment_method" checked={paymentMethod === id} readOnly />
                  <i className={`bi ${icon} fs-4 text-success`}></i>
                  <span className="fw-bold">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '90px' }}>
              <h5 className="fw-bold mb-3">Order Final Summary</h5>

              <div className="p-3 bg-light rounded-3 mb-3 small">
                <span className="text-muted d-block fw-bold">Shipping Address:</span>
                <span className="text-dark">{address}</span>
              </div>

              <div className="d-grid gap-2 small border-bottom pb-3 mb-3">
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Produce Amount</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Freight & Transport</span>
                  <span>₹{deliveryFee}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Platform Fee</span>
                  <span>₹{platformFee}</span>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <span className="fw-bold">Grand Total</span>
                <span className="price-tag fs-3">₹{grandTotal.toLocaleString()}</span>
              </div>

              <button 
                className="btn btn-success btn-lg w-100 py-3 fw-bold"
                onClick={handlePay}
                disabled={submitting}
              >
                {submitting ? 'Authorizing Payment...' : `Pay ₹${grandTotal.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
