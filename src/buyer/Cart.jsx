import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import { api } from '../../services/api';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    const data = await api.getCart();
    setCart(data);
    setLoading(false);
  };

  const handleQtyChange = async (cartId, newQty) => {
    await api.updateCartQuantity(cartId, newQty);
    loadCart();
  };

  const handleRemove = async (cartId) => {
    await api.removeFromCart(cartId);
    loadCart();
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-success"></div></div>;

  const subtotal = cart.reduce((sum, item) => sum + item.price_per_unit * item.quantity, 0);
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
                        <th>Quantity</th>
                        <th>Subtotal</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map(item => (
                        <tr key={item.cart_id}>
                          <td>
                            <div className="fw-bold">{item.product_name}</div>
                            <small className="text-muted">Farmer: {item.farmer_name || 'Ramesh Babu'}</small>
                          </td>
                          <td>₹{item.price_per_unit}/{item.unit}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <button 
                                className="btn btn-sm btn-outline-secondary px-2"
                                onClick={() => handleQtyChange(item.cart_id, item.quantity - 1)}
                              >
                                -
                              </button>
                              <span className="fw-bold px-2">{item.quantity}</span>
                              <button 
                                className="btn btn-sm btn-outline-secondary px-2"
                                onClick={() => handleQtyChange(item.cart_id, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="fw-bold text-success">₹{(item.price_per_unit * item.quantity).toLocaleString()}</td>
                          <td>
                            <button className="btn btn-sm btn-link text-danger p-0" onClick={() => handleRemove(item.cart_id)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
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
                  <span className="price-tag fs-3">₹{grandTotal.toLocaleString()}</span>
                </div>

                <Link to="/buyer/checkout" className="btn btn-success btn-lg w-100 py-3 fw-bold">
                  Proceed to Checkout <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
