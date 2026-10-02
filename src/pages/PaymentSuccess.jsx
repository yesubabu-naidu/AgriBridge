import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import DownloadReceiptButton from '../components/DownloadReceiptButton';

export default function PaymentSuccess() {
  const location = useLocation();
  const state = location.state || {};

  const txId = state.transaction_id || `AGRI${Date.now()}`;
  const amount = state.amount || 40590;
  const role = state.role || 'farmer';

  return (
    <div className="payment-success-page py-5">
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8 text-center">
            <div className="card border-0 shadow-lg rounded-4 p-5 bg-white">
              {/* Checkmark Animation Circle */}
              <div className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle mx-auto mb-4" style={{ width: '90px', height: '90px' }}>
                <i className="bi bi-check-lg fs-1"></i>
              </div>

              <h2 className="fw-black text-dark mb-1">Payment Successful!</h2>
              <p className="text-muted mb-4">Your transaction has been securely recorded and verified.</p>

              <div className="p-4 bg-light rounded-4 mb-4 text-start">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Amount Paid:</span>
                  <strong className="text-success fs-5">₹{Number(amount).toLocaleString()}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Transaction ID:</span>
                  <strong className="font-monospace small">{txId}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Payment Status:</span>
                  <span className="badge bg-success-subtle text-success rounded-pill px-3">Successful</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Date & Time:</span>
                  <small className="text-muted">{new Date().toLocaleString('en-IN')}</small>
                </div>
              </div>

              <div className="d-grid gap-2">
                <DownloadReceiptButton
                  transactionId={txId}
                  label="Download Official Receipt"
                  variant="outline-success"
                  size="md"
                  className="py-2 fw-bold justify-content-center"
                />
                <Link to={`/${role}/dashboard`} className="btn btn-success py-2 fw-bold">
                  Go to {role.toUpperCase()} Dashboard <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
