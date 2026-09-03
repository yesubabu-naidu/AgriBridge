import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function FarmerPayment() {
  const { leaseId } = useParams();
  const navigate = useNavigate();
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('ramesh@upi');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLease();
  }, [leaseId]);

  const loadLease = async () => {
    const leases = await api.getFarmerLeases();
    const found = leases.find(l => String(l.id) === String(leaseId)) || leases[0];
    setLease(found);
    setLoading(false);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const amount = Number(lease.annual_price || 40000);
    const res = await api.makeFarmerPayment({
      leaseId: lease.id,
      amount,
      paymentMethod
    });
    setSubmitting(false);

    navigate('/payment/success', {
      state: {
        transaction_id: res.transaction_id || `AGRI${Date.now()}`,
        amount,
        role: 'farmer'
      }
    });
  };

  if (loading || !lease) return <div className="text-center py-5"><div className="spinner-border text-success"></div></div>;

  const basePrice = Number(lease.annual_price || 40000);
  const platformFee = 500;
  const gst = Math.round(basePrice * 0.02);
  const total = basePrice + platformFee + gst;

  return (
    <div className="farmer-payment-page">
      <div className="mb-4">
        <span className="eyebrow">CHECKOUT PAYMENT</span>
        <h2 className="fw-black mb-1">Complete Your Lease Payment</h2>
        <p className="text-muted small">Select your preferred payment method to activate your farmland lease.</p>
      </div>

      <div className="payment-layout">
        {/* Left: Payment Method Selection */}
        <div>
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold mb-3">Select Payment Method</h5>

            {[
              ['UPI', 'UPI Payment (GPay / PhonePe / Paytm)', 'bi-qr-code-scan'],
              ['Card', 'Credit / Debit Card', 'bi-credit-card-2-front'],
              ['Net Banking', 'Net Banking (SBI / HDFC / ICICI)', 'bi-bank'],
              ['Wallet', 'AgriBridge Wallet', 'bi-wallet2']
            ].map(([id, label, icon]) => (
              <div 
                key={id}
                className={`payment-method-card d-flex align-items-center gap-3 ${paymentMethod === id ? 'selected' : ''}`}
                onClick={() => setPaymentMethod(id)}
              >
                <input type="radio" name="payment_method" checked={paymentMethod === id} readOnly />
                <i className={`bi ${icon} fs-4 text-success`}></i>
                <span className="fw-bold">{label}</span>
              </div>
            ))}

            {/* Dynamic Form per Payment Method */}
            <div className="mt-4 p-3 bg-light rounded-3">
              {paymentMethod === 'UPI' && (
                <div>
                  <label className="form-label fw-bold">Enter UPI ID</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@upi"
                  />
                  <small className="text-muted mt-1 d-block">You will receive a payment request on your UPI app.</small>
                </div>
              )}

              {paymentMethod === 'Card' && (
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-bold">Card Number</label>
                    <input type="text" className="form-control" placeholder="4532 •••• •••• 8892" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold">Expiry Date</label>
                    <input type="text" className="form-control" placeholder="MM/YY" />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold">CVV</label>
                    <input type="password" className="form-control" placeholder="•••" maxLength="3" />
                  </div>
                </div>
              )}

              {paymentMethod === 'Net Banking' && (
                <div>
                  <label className="form-label fw-bold">Select Bank</label>
                  <select className="form-select">
                    <option>State Bank of India (SBI)</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                  </select>
                </div>
              )}

              {paymentMethod === 'Wallet' && (
                <div>
                  <p className="mb-0 text-success fw-bold"><i className="bi bi-wallet2 me-1"></i> Available Wallet Balance: ₹50,000</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div>
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '90px' }}>
            <h5 className="fw-bold mb-3">Order Summary</h5>

            <div className="p-3 bg-light rounded-3 mb-3">
              <h6 className="fw-bold mb-1">{lease.land_name}</h6>
              <small className="text-muted d-block mb-1"><i className="bi bi-geo-alt me-1"></i>{lease.location}</small>
              <small className="text-muted d-block">Landowner: {lease.owner_name}</small>
            </div>

            <div className="d-grid gap-2 small border-bottom pb-3 mb-3">
              <div className="d-flex justify-content-between">
                <span className="text-muted">Annual Lease Fee</span>
                <span>₹{basePrice.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Platform Facilitation Fee</span>
                <span>₹{platformFee.toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">GST & Taxes (2%)</span>
                <span>₹{gst.toLocaleString()}</span>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <span className="fw-bold">Total Payable</span>
              <span className="price-tag fs-3">₹{total.toLocaleString()}</span>
            </div>

            <button 
              className="btn btn-success btn-lg w-100 py-3 fw-bold"
              onClick={handlePay}
              disabled={submitting}
            >
              {submitting ? 'Processing Payment...' : `Pay ₹${total.toLocaleString()}`}
            </button>

            <small className="text-muted text-center d-block mt-3">
              <i className="bi bi-shield-lock-fill text-success me-1"></i> 256-Bit Encrypted Secure Payment
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
