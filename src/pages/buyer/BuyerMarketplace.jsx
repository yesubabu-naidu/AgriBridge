import React, { useState, useEffect } from 'react';
import ProductCard from '../../components/ProductCard';
import { CardSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import Toast from '../../components/Toast';
import { api } from '../../services/api';

export default function BuyerMarketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    loadProducts();
  }, [search, category]);

  const loadProducts = async () => {
    setLoading(true);
    const data = await api.getProducts({ search, category });
    setProducts(data);
    setLoading(false);
  };

  const handleAddToCart = async (product) => {
    const result = await api.addToCart(product, 1);
    if (!result?.success) {
      const errorToast = { id: Date.now(), message: result?.message || "Unable to add this crop to your cart." };
      setToasts((prev) => [...prev, errorToast]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== errorToast.id)), 3000);
      return result;
    }
    const newToast = { id: Date.now(), message: "Added " + product.product_name + " to your cart!" };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== newToast.id)), 3000);
    return result;
  };

  return (
    <div className="buyer-marketplace-page py-5">
      <div className="container">
        {/* Header */}
        <div className="mb-4">
          <span className="eyebrow">FARM DIRECT PRODUCE</span>
          <h1 className="fw-black mb-2">Agricultural Produce Store</h1>
          <p className="text-muted">Buy fresh rice, spices, grains, and vegetables directly from verified farmers.</p>
        </div>

        {/* Filter Bar */}
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
          <div className="row g-3 align-items-center">
            <div className="col-lg-6 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-0 text-muted"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control bg-light border-0"
                  placeholder="Search by produce name or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="col-lg-4 col-md-4">
              <select
                className="form-select bg-light border-0"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Produce Categories</option>
                <option value="Grains">Grains (Rice / Corn)</option>
                <option value="Spices">Spices (Guntur Chilli)</option>
                <option value="Vegetables">Vegetables (Tomatoes)</option>
                <option value="Fiber">Fiber (Cotton)</option>
              </select>
            </div>

            <div className="col-lg-2 col-md-2">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearch(''); setCategory(''); }}>
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="row g-4">
            {[1, 2, 3, 4, 5, 6].map(i => <div className="col-lg-4 col-md-6" key={i}><CardSkeleton /></div>)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState icon="bi-shop" title="No Products Available" description="No produce items found matching your filters." />
        ) : (
          <div className="row g-4">
            {products.map(product => (
              <div className="col-lg-4 col-md-6" key={product.id}>
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        )}
      </div>

      <Toast toasts={toasts} onClose={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
