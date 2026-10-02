import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import { api } from '../../services/api';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  const [stockError, setStockError] = useState(null);
  const [validating, setValidating] = useState(false);

  // Debounce timers ref per cart item
  const debounceTimers = useRef({});
  // Ref to hold current cart state for callbacks without stale closures
  const cartRef = useRef(cart);
  cartRef.current = cart;

  useEffect(() => {
    loadCart();
    return () => {
      Object.values(debounceTimers.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      setStockError(null);
      const data = await api.getCart();
      setCart(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const notifyCartUpdated = () => {
    window.dispatchEvent(new CustomEvent('agribridge:cart-updated'));
  };

  const persistQuantity = useCallback(async (cartId, targetQty, prevQty) => {
    setUpdatingIds((prev) => new Set(prev).add(cartId));
    try {
      const res = await api.updateCartQuantity(cartId, targetQty);
      if (!res?.success) {
        // Rollback to previous quantity on error
        setCart((current) =>
          current.map((item) =>
            item.cart_id === cartId ? { ...item, quantity: prevQty } : item
          )
        );
        setStockError(res?.message || 'Unable to update quantity for this item.');
      } else {
        setStockError(null);
        notifyCartUpdated();
      }
    } catch (err) {
      setCart((current) =>
        current.map((item) =>
          item.cart_id === cartId ? { ...item, quantity: prevQty } : item
        )
      );
      setStockError('Network or server error while updating cart.');
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(cartId);
        return next;
      });
    }
  }, []);

  const handleStepQty = (item, delta) => {
    const cartId = item.cart_id;
    const currentQty = Number(item.quantity) || 1;
    const maxQty = item.available_qty != null ? Number(item.available_qty) : Infinity;
    const nextQty = currentQty + delta;

    if (nextQty < 1) return;
    if (nextQty > maxQty) {
      setStockError(`Only ${maxQty} units of "${item.product_name}" are currently available.`);
      return;
    }

    setStockError(null);

    // Optimistically update React state immediately
    setCart((current) =>
      current.map((c) =>
        c.cart_id === cartId ? { ...c, quantity: nextQty } : c
      )
    );

    // Debounce backend sync so rapid clicks accumulate smoothly
    if (debounceTimers.current[cartId]) {
      clearTimeout(debounceTimers.current[cartId]);
    }

    debounceTimers.current[cartId] = setTimeout(() => {
      persistQuantity(cartId, nextQty, currentQty);
      delete debounceTimers.current[cartId];
    }, 250);
  };

  const handleManualQtyChange = (item, rawValue) => {
    const cartId = item.cart_id;
    const sanitized = rawValue.replace(/[^0-9]/g, '');
    const currentQty = Number(item.quantity) || 1;

    if (sanitized === '') {
      // Allow user to empty the input while typing, store as temporary string
      setCart((current) =>
        current.map((c) =>
          c.cart_id === cartId ? { ...c, quantity: '' } : c
        )
      );
      return;
    }

    let nextQty = parseInt(sanitized, 10);
    if (nextQty <= 0) nextQty = 1;

    const maxQty = item.available_qty != null ? Number(item.available_qty) : Infinity;
    if (nextQty > maxQty) {
      setStockError(`Only ${maxQty} units of "${item.product_name}" are currently available.`);
      nextQty = maxQty;
    } else {
      setStockError(null);
    }

    // Immediate state update
    setCart((current) =>
      current.map((c) =>
        c.cart_id === cartId ? { ...c, quantity: nextQty } : c
      )
    );

    if (debounceTimers.current[cartId]) {
      clearTimeout(debounceTimers.current[cartId]);
    }

    debounceTimers.current[cartId] = setTimeout(() => {
      persistQuantity(cartId, nextQty, currentQty);
      delete debounceTimers.current[cartId];
    }, 400);
  };

  const handleManualQtyBlur = (item) => {
    const cartId = item.cart_id;
    if (item.quantity === '' || Number(item.quantity) < 1) {
      setCart((current) =>
        current.map((c) =>
          c.cart_id === cartId ? { ...c, quantity: 1 } : c
        )
      );
      persistQuantity(cartId, 1, 1);
    }
  };

  const handleRemove = async (cartId) => {
    setUpdatingIds((prev) => new Set(prev).add(cartId));
    try {
      await api.removeFromCart(cartId);
      setCart((current) => current.filter((item) => item.cart_id !== cartId));
      notifyCartUpdated();
    } catch (err) {
      console.error('Failed to remove cart item:', err);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(cartId);
        return next;
      });
    }
  };

  const handleProceedToCheckout = async (e) => {
    e.preventDefault();
    if (validating || cart.length === 0) return;

    // Check for any empty/zero inputs
    const invalidItem = cart.find((i) => !i.quantity || Number(i.quantity) < 1);
    if (invalidItem) {
      setStockError('Please enter a valid quantity for all items.');
      return;
    }

    setValidating(true);
    setStockError(null);

    try {
      // Server-side stock verification
      const check = await api.validateCartStock();
      if (!check?.success) {
        setStockError(check?.message || 'One or more items in your cart exceed available stock.');
        setValidating(false);
        return;
      }
      navigate('/buyer/checkout');
    } catch (err) {
      setStockError('Unable to verify available inventory. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading shopping cart...</span>
        </div>
      </div>
    );
  }

  const subtotal = cart.reduce((sum, item) => {
    const q = Number(item.quantity) || 0;
    const p = Number(item.price_per_unit) || 0;
    return sum + p * q;
  }, 0);

  const deliveryFee = subtotal > 0 ? 150 : 0;
  const platformFee = subtotal > 0 ? 50 : 0;
  const grandTotal = subtotal + deliveryFee + platformFee;

  return (
    <div className="cart-page py-5">
      <div className="container">
        <div className="mb-4">
          <span className="eyebrow">SHOPPING CART</span>
          <h2 className="fw-black mb-1">Your Shopping Cart</h2>
          <p className="text-muted small">Review produce items and proceed to checkout delivery.</p>
        </div>

        {stockError && (
          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            <div className="fw-semibold">{stockError}</div>
          </div>
        )}

        {cart.length === 0 ? (
          <EmptyState
            icon="bi-cart-x"
            title="Your Cart is Empty"
            description="You don't have any agricultural produce items in your cart."
            actionText="Explore Produce Store"
            actionLink="/buyer/marketplace"
          />
        ) : (
          <div className="row g-4">
            {/* Cart Items List */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr className="text-muted small">
                        <th>Product</th>
                        <th>Price</th>
                        <th style={{ minWidth: '150px' }}>Quantity</th>
                        <th>Subtotal</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item) => {
                        const isBusy = updatingIds.has(item.cart_id);
                        const qtyNum = Number(item.quantity) || 0;
                        const maxStock = item.available_qty != null ? Number(item.available_qty) : Infinity;

                        return (
                          <tr key={item.cart_id}>
                            <td>
                              <div className="fw-bold">{item.product_name}</div>
                              <small className="text-muted">Farmer: {item.farmer_name || 'AgriBridge Farmer'}</small>
                              {item.available_qty != null && (
                                <div className="text-muted extra-small">
                                  In Stock: {item.available_qty} {item.unit}
                                </div>
                              )}
                            </td>
                            <td>
                              ₹{item.price_per_unit}/{item.unit}
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1" style={{ maxWidth: '140px' }}>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary px-2 py-1"
                                  onClick={() => handleStepQty(item, -1)}
                                  disabled={qtyNum <= 1 || isBusy}
                                  title="Decrease quantity"
                                  aria-label="Decrease quantity"
                                >
                                  −
                                </button>

                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  className="form-control form-control-sm text-center fw-bold px-1"
                                  style={{ width: '56px', minWidth: '48px' }}
                                  value={item.quantity}
                                  onChange={(e) => handleManualQtyChange(item, e.target.value)}
                                  onBlur={() => handleManualQtyBlur(item)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') e.target.blur();
                                  }}
                                  disabled={isBusy}
                                  aria-label="Direct quantity input"
                                />

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary px-2 py-1"
                                  onClick={() => handleStepQty(item, 1)}
                                  disabled={qtyNum >= maxStock || isBusy}
                                  title="Increase quantity"
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="fw-bold text-success">
                              ₹{(Number(item.price_per_unit) * (Number(item.quantity) || 0)).toLocaleString()}
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-danger p-0"
                                onClick={() => handleRemove(item.cart_id)}
                                disabled={isBusy}
                                title="Remove item"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                  <Link to="/buyer/marketplace" className="btn btn-outline-success">
                    <i className="bi bi-arrow-left me-1"></i> Continue Shopping
                  </Link>
                </div>
              </div>
            </div>

            {/* Order Summary Side Card */}
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '90px' }}>
                <h5 className="fw-bold mb-3">Order Summary</h5>

                <div className="d-grid gap-2 small border-bottom pb-3 mb-3">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Delivery & Freight</span>
                    <span>₹{deliveryFee}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Platform Fee</span>
                    <span>₹{platformFee}</span>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fw-bold">Grand Total</span>
                  <span className="price-tag fs-3 text-success fw-bold">₹{grandTotal.toLocaleString()}</span>
                </div>

                <button
                  type="button"
                  className="btn btn-success btn-lg w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                  onClick={handleProceedToCheckout}
                  disabled={validating || cart.length === 0}
                >
                  {validating && <span className="spinner-border spinner-border-sm" role="status"></span>}
                  <span>{validating ? 'Verifying Inventory...' : 'Proceed to Checkout'}</span>
                  {!validating && <i className="bi bi-arrow-right ms-1"></i>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
