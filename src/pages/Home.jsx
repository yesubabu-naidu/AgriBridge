import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LandCard from '../components/LandCard';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { api } from '../services/api';

export default function Home() {
  const [featuredLands, setFeaturedLands] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const lands = await api.getLands();
      const products = await api.getProducts();
      setFeaturedLands(Array.isArray(lands) ? lands : []);
      setFeaturedProducts(Array.isArray(products) ? products : []);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="home-page">
      {/* 1. HERO SECTION WITH AGRIPULSE INTELLIGENCE OVERLAYS */}
      <section className="hero position-relative">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="eyebrow">
                <i className="bi bi-cpu-fill text-success"></i> The Operating System for Modern Agriculture
              </span>
              <h1 className="hero-heading mb-3">
                Smarter Farming Starts with <span>Real-Time Intelligence</span>
              </h1>
              <p className="lead text-muted mb-4">
                Discover agricultural land, lease your property, optimize crop yield with field intelligence, and connect with commercial buyers across Andhra Pradesh & Telangana.
              </p>
              <div className="d-flex flex-wrap gap-3 mb-4">
                <Link to="/marketplace" className="btn btn-success btn-lg px-4">
                  <i className="bi bi-compass me-2"></i> Explore Farmlands
                </Link>
                <Link to="/buyer/marketplace" className="btn btn-light-green btn-lg px-4">
                  <i className="bi bi-shop me-2"></i> Explore Produce Store
                </Link>
              </div>

              {/* Statistics Counter */}
              <div className="row g-3">
                <div className="col-4">
                  <div className="stat-pill flex-column align-items-start p-3">
                    <h3 className="mb-0 text-success">100%</h3>
                    <small className="text-muted fw-bold">Verified Lands</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="stat-pill flex-column align-items-start p-3">
                    <h3 className="mb-0 text-success">Direct</h3>
                    <small className="text-muted fw-bold">Farmer Trading</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="stat-pill flex-column align-items-start p-3">
                    <h3 className="mb-0 text-success">Zero</h3>
                    <small className="text-muted fw-bold">Middlemen</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="agri-intelligence-banner text-center position-relative">
                <span className="badge bg-success-subtle text-success mb-3 px-3 py-2 rounded-pill fw-bold border border-success">
                  <i className="bi bi-drone me-1"></i> Live Drone Monitoring & Analytics
                </span>
                <img
                  src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1000"
                  alt="Drone over farmland"
                  className="agri-drone-visual shadow-lg"
                />
              </div>

              {/* Intelligence Overlays */}
              <div className="intel-grid">
                <div className="intel-card">
                  <div className="text-white-50 extra-small fw-bold uppercase">Yield Efficiency</div>
                  <div className="intel-metric">84%</div>
                  <div className="intel-badge-down">
                    <i className="bi bi-arrow-down-right"></i> 12% last mth
                  </div>
                </div>

                <div className="intel-card">
                  <div className="text-white-50 extra-small fw-bold uppercase">Crop Health Score</div>
                  <div className="intel-metric">92%</div>
                  <div className="intel-badge-up">
                    <i className="bi bi-arrow-up-right"></i> 8% last mth
                  </div>
                </div>

                <div className="intel-card">
                  <div className="text-white-50 extra-small fw-bold uppercase">Water Optimization</div>
                  <div className="intel-metric">37%</div>
                  <div className="intel-badge-up">
                    <i className="bi bi-arrow-up-right"></i> 15% last mth
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container py-4">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '640px' }}>
            <span className="eyebrow">SIMPLE STREAMLINED PROCESS</span>
            <h2 className="section-heading mb-2">How AgriBridge Works</h2>
            <p className="text-muted">Four simple steps to lease land, manage smart farm intelligence, or trade produce online.</p>
          </div>

          <div className="row g-4">
            {[
              { num: '01', title: 'Register', desc: 'Create your verified account as a Farmer, Landowner, or Produce Buyer.', icon: 'bi-person-plus-fill' },
              { num: '02', title: 'Discover', desc: 'Browse verified agricultural land listings with soil, water & crop suitability data.', icon: 'bi-search' },
              { num: '03', title: 'Connect', desc: 'Submit lease applications directly or purchase fresh farm produce in bulk.', icon: 'bi-file-earmark-text-fill' },
              { num: '04', title: 'Grow', desc: 'Complete payments via secure UPI/Card and manage active farm operations.', icon: 'bi-graph-up-arrow' }
            ].map(step => (
              <div className="col-lg-3 col-md-6" key={step.num}>
                <div className="card border-0 bg-light p-4 rounded-4 h-100 position-relative shadow-sm hover-up">
                  <span className="position-absolute top-0 end-0 m-3 text-success opacity-25 fw-black fs-2">{step.num}</span>
                  <div className="bg-success text-white p-3 rounded-3 d-inline-flex mb-3" style={{ width: '52px', height: '52px', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`bi ${step.icon} fs-4`}></i>
                  </div>
                  <h5 className="fw-bold mb-2">{step.title}</h5>
                  <p className="text-muted small mb-0">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FEATURED LANDS */}
      <section className="py-5">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4">
            <div>
              <span className="eyebrow">AGRICULTURAL REAL ESTATE</span>
              <h2 className="section-heading mb-0">Featured Farmlands for Lease</h2>
            </div>
            <Link to="/marketplace" className="btn btn-outline-success mt-3 mt-md-0">
              View All Lands <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
          ) : featuredLands.length === 0 ? (
            <EmptyState
              icon="bi-map"
              title="No Farmland Listings Published Yet"
              description="Be the first landowner to publish an agricultural land listing for lease."
              actionText="Add New Land Listing"
              actionLink="/landowner/add-land"
            />
          ) : (
            <div className="row g-4">
              {featuredLands.map(land => (
                <div className="col-lg-4 col-md-6" key={land.id}>
                  <LandCard land={land} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. MEASURABLE RESULTS */}
      <section className="py-5 bg-dark text-white position-relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #111a12 0%, #172018 100%)' }}>
        <div className="container py-4 position-relative z-2">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '640px' }}>
            <span className="eyebrow bg-success text-white border-0">PROVEN IMPACT</span>
            <h2 className="section-heading text-white mb-2">Technology That Delivers Measurable Results</h2>
            <p className="text-white-50">Transforming agricultural yields with real-time field performance tracking.</p>
          </div>

          <div className="row g-4 text-center">
            <div className="col-6 col-md-3">
              <div className="p-4 rounded-4 bg-white bg-opacity-10 border border-white border-opacity-10">
                <h2 className="display-5 fw-black text-success mb-1">38%</h2>
                <small className="text-white-50 fw-bold">Optimized Water Usage</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-4 rounded-4 bg-white bg-opacity-10 border border-white border-opacity-10">
                <h2 className="display-5 fw-black text-success mb-1">92%</h2>
                <small className="text-white-50 fw-bold">Operational Accuracy</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-4 rounded-4 bg-white bg-opacity-10 border border-white border-opacity-10">
                <h2 className="display-5 fw-black text-success mb-1">500+</h2>
                <small className="text-white-50 fw-bold">Managed Farmland Zones</small>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-4 rounded-4 bg-white bg-opacity-10 border border-white border-opacity-10">
                <h2 className="display-5 fw-black text-success mb-1">4X</h2>
                <small className="text-white-50 fw-bold">Faster Lease Transactions</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AGRICULTURAL PRODUCE MARKETPLACE PREVIEW */}
      <section className="py-5 bg-white border-top">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4">
            <div>
              <span className="eyebrow">DIRECT FROM FARMERS</span>
              <h2 className="section-heading mb-0">Agricultural Produce Store</h2>
            </div>
            <Link to="/buyer/marketplace" className="btn btn-outline-success mt-3 mt-md-0">
              Explore Store <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
          ) : featuredProducts.length === 0 ? (
            <EmptyState
              icon="bi-shop"
              title="No Produce Items Listed Yet"
              description="Be the first farmer to list your harvested crops or produce for commercial buyers."
              actionText="Add Crop Produce"
              actionLink="/farmer/add-crop"
            />
          ) : (
            <div className="row g-4">
              {featuredProducts.map(product => (
                <div className="col-lg-4 col-md-6" key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-5 bg-light">
        <div className="container py-4">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '600px' }}>
            <span className="eyebrow">TRUSTED BY FARMERS</span>
            <h2 className="section-heading mb-2">Loved by Modern Agriculturalists</h2>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 p-4 rounded-4 shadow-sm">
                <div className="text-warning mb-2">★★★★★</div>
                <p className="text-muted small">"AgriBridge allowed me to lease land within 3 days. The title verification gave me complete peace of mind."</p>
                <div className="d-flex align-items-center gap-3 mt-auto">
                  <div className="bg-success text-white rounded-circle fw-bold d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>R</div>
                  <div>
                    <h6 className="fw-bold mb-0">Ramesh Babu</h6>
                    <small className="text-muted">Farmer, Prakasam</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 p-4 rounded-4 shadow-sm">
                <div className="text-warning mb-2">★★★★★</div>
                <p className="text-muted small">"As a landowner, managing leases and receiving automated rent payments has never been easier."</p>
                <div className="d-flex align-items-center gap-3 mt-auto">
                  <div className="bg-success text-white rounded-circle fw-bold d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>V</div>
                  <div>
                    <h6 className="fw-bold mb-0">Venkatesh Rao</h6>
                    <small className="text-muted">Landowner, Guntur</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card h-100 border-0 p-4 rounded-4 shadow-sm">
                <div className="text-warning mb-2">★★★★★</div>
                <p className="text-muted small">"Buying organic crops directly from verified farmers saved us 18% in procurement costs."</p>
                <div className="d-flex align-items-center gap-3 mt-auto">
                  <div className="bg-success text-white rounded-circle fw-bold d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>P</div>
                  <div>
                    <h6 className="fw-bold mb-0">Priya Sharma</h6>
                    <small className="text-muted">Bulk Buyer, Vijayawada</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CALL TO ACTION */}
      <section className="py-5 text-white position-relative" style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)' }}>
        <div className="container py-4 text-center">
          <h2 className="fw-bold display-6 mb-3">Grow Smarter with Intelligent Agriculture</h2>
          <p className="text-white-50 mx-auto mb-4" style={{ maxWidth: '640px' }}>
            Join thousands of farmers, landowners, and commercial buyers trading agricultural land and produce securely.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/auth?mode=register" className="btn btn-warning text-dark fw-bold btn-lg px-4">
              Get Started Now <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}