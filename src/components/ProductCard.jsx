import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  const fallbackImage = "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800";

  const handleAddToCartClick = () => {
    const savedUser = localStorage.getItem('agribridge_user');
    if (!savedUser) {
      navigate('/auth?mode=login');
      return;
    }
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleBuyNowClick = async () => {
    const savedUser = localStorage.getItem("agribridge_user");
    if (!savedUser) {
      navigate("/auth?mode=login");
      return;
    }
    const result = onAddToCart ? await onAddToCart(product) : { success: true };
    if (result?.success === false) return;
    navigate("/buyer/checkout");
  };

  return (
    <div className="product-card">
      <div className="position-relative">
        <img src={product.image_url || fallbackImage} alt={product.product_name} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = fallbackImage; }} />
        <span className="position-absolute top-0 start-0 m-3 badge bg-success text-white shadow-sm rounded-pill fw-bold px-3 py-1">
          {product.category}
        </span>
        <span className="position-absolute bottom-0 end-0 m-3 badge bg-dark bg-opacity-75 text-warning rounded-pill px-2 py-1">
          ★ {product.rating || 4.9}
        </span>
      </div>

      <div className="product-body d-flex flex-column">
        <span className="text-muted extra-small"><i className="bi bi-person me-1"></i>{product.farmer_name} · {product.location}</span>
        <h5>{product.product_name}</h5>
        
        <div className="my-2">
          <span className="price-tag">₹{product.price_per_unit}</span>
          <span className="text-muted small"> / {product.unit}</span>
        </div>

        <p className="text-muted small text-truncate mb-3">{product.description}</p>

        <div className="mt-auto d-flex gap-2">
          <button 
            className="btn btn-outline-success btn-sm flex-grow-1"
            onClick={handleAddToCartClick}
          >
            <i className="bi bi-cart-plus me-1"></i> Add to Cart
          </button>
          <button 
            className="btn btn-success btn-sm"
            onClick={handleBuyNowClick}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
