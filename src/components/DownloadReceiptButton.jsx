import React, { useState } from 'react';
import { api } from '../services/api';

export default function DownloadReceiptButton({
  transactionId,
  orderId,
  label = 'Download Receipt',
  variant = 'outline-success',
  size = 'sm',
  className = '',
  iconOnly = false
}) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const targetId = transactionId || orderId;

  const handleDownload = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (downloading || !targetId) return;

    try {
      setDownloading(true);
      setError(null);
      await api.downloadReceipt(targetId);
    } catch (err) {
      console.error('Receipt download error:', err);
      setError(err.message || 'Unable to download receipt.');
      alert(err.message || 'Unable to download receipt. Please check your connection.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-${size} ${className} d-inline-flex align-items-center gap-1`}
      onClick={handleDownload}
      disabled={downloading || !targetId}
      title={error || 'Download official PDF receipt'}
      aria-label="Download Receipt"
    >
      {downloading ? (
        <>
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          {!iconOnly && <span>Generating...</span>}
        </>
      ) : (
        <>
          <i className="bi bi-download"></i>
          {!iconOnly && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
