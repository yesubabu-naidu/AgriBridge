import React, { useEffect, useRef } from 'react';

/**
 * Logout confirmation modal component for AgriBridge.
 *
 * Requirements:
 * - Title: "Confirm Logout"
 * - Message: "Are you sure you want to logout?"
 * - Buttons: [ Cancel ] [ Logout ]
 * - Cancel: AgriBridge green background, white text, darker on hover (safe action).
 * - Logout: Red background, white text, darker on hover (destructive action).
 * - Escape key & click outside close the modal without logging out.
 * - Responsive, centered, rounded corners, subtle shadow & animation.
 */
export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="logout-modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-message"
    >
      <div className="logout-modal-card" ref={modalRef}>
        <div className="logout-modal-icon-badge" aria-hidden="true">
          <i className="bi bi-box-arrow-right"></i>
        </div>

        <h5 id="logout-dialog-title" className="logout-modal-title">
          Confirm Logout
        </h5>

        <p id="logout-dialog-message" className="logout-modal-message">
          Are you sure you want to logout?
        </p>

        <div className="logout-modal-actions">
          <button
            type="button"
            className="btn logout-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn logout-btn-confirm"
            onClick={onConfirm}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
