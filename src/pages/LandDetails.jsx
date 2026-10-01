import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { api } from '../services/api';

export default function LandDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [land, setLand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedMonths, setProposedMonths] = useState(12);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successAlert, setSuccessAlert] = useState(false);

  useEffect(() => {
    loadLand();
  }, [id]);

  const loadLand = async () => {
    setLoading(true);
    const data = await api.getLandById(id);
    setLand(data);
    setProposedPrice(data.lease_price || '');
    setLoading(false);
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/auth?mode=login');
      return;
    }
    setSubmitting(true);
    const result = await api.applyForLease({
      land_id: land.id,
      land_name: land.land_name,
      location: land.location,
      owner_name: land.owner_name,
      farmer_name: user.full_name || 'Farmer User',
      proposed_price: Number(proposedPrice),
      proposed_duration_months: Number(proposedMonths),
      message
    });
    setSubmitting(false);
    if (!result.success) {
      alert(result.message || "Unable to submit the lease application.");
      return;
    }
    setShowApplyModal(false);
    setSuccessAlert(true);
  };

  if (loading || !land) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-3 text-muted">Loading land details...</p>
      </div>
    );
  }

  const images = land.images && land.images.length > 0 
    ? land.images 
    : ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'];

  return (
    <div className="land-details-page py-5">
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/marketplace">Marketplace</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{land.land_name}</li>
          </ol>
        </nav>

        {successAlert && (
          <div className="alert alert-success alert-dismissible fade show rounded-4 mb-4" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            Your lease application has been successfully submitted to <strong>{land.owner_name}</strong>! Track progress under <Link to="/farmer/applications" className="alert-link">Farmer Dashboard Applications</Link>.
            <button type="button" className="btn-close" onClick={() => setSuccessAlert(false)}></button>
          </div>
        )}

        <div className="row g-4">
          {/* Gallery */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-3">
              <img 
                src={images[activeImg]} 
                alt={land.land_name} 
                className="img-fluid w-100" 
                style={{ maxHeight: '420px', objectFit: 'cover' }} 
              />
            </div>
            {images.length > 1 && (
              <div className="d-flex gap-2">
                {images.map((img, i) => (
                  <img 
                    key={i} 
                    src={img} 
                    alt="Thumbnail" 
                    className={`rounded-3 border cursor-pointer ${activeImg === i ? 'border-success border-2' : ''}`}
                    style={{ width: '90px', height: '65px', objectFit: 'cover' }}
                    onClick={() => setActiveImg(i)}
                  />
                ))}
              </div>
            )}

            <div className="card border-0 shadow-sm rounded-4 p-4 mt-4 bg-white">
              <h5 className="fw-bold mb-3">Property Description</h5>
              <p className="text-muted leading-relaxed mb-4">{land.description}</p>

              <h5 className="fw-bold mb-3">Specifications & Infrastructure</h5>
              <div className="row g-3">
                {[
                  ['Soil Type', land.soil_type, 'bi-layers'],
                  ['Water Source', land.water_source, 'bi-droplet-fill'],
                  ['Electricity', land.electricity === 'yes' ? 'Available (3-Phase)' : 'Not Available', 'bi-lightning-charge-fill'],
                  ['Road Access', land.road_access === 'yes' ? 'Tar Road Connected' : 'Unpaved Access', 'bi-truck'],
                  ['Suitable Crops', land.suitable_crops, 'bi-flower1'],
                  ['District / State', `${land.district || 'Prakasam'}, ${land.state || 'Andhra Pradesh'}`, 'bi-geo-alt-fill']
                ].map(([label, val, icon], idx) => (
                  <div className="col-md-6" key={idx}>
                    <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3">
                      <i className={`bi ${icon} text-success fs-4`}></i>
                      <div>
                        <small className="text-muted d-block">{label}</small>
                        <strong className="text-dark">{val}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info & Action */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '90px' }}>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small"><i className="bi bi-geo-alt me-1"></i>{land.location}</span>
                <StatusBadge status={land.status || 'approved'} />
              </div>

              <h3 className="fw-black mb-3">{land.land_name}</h3>

              <div className="p-3 bg-light rounded-4 mb-4">
                <small className="text-muted d-block">Annual Lease Fee</small>
                <div className="d-flex align-items-baseline gap-2">
                  <span className="price-tag fs-2">₹{Number(land.lease_price).toLocaleString()}</span>
                  <span className="text-muted">/ year ({land.acres} Acres)</span>
                </div>
              </div>

              {/* Landowner Info */}
              <div className="d-flex align-items-center gap-3 p-3 border rounded-3 mb-4">
                <div className="bg-success-subtle text-success p-3 rounded-circle">
                  <i className="bi bi-person-fill fs-4"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-0">{land.owner_name || 'Venkatesh Rao'}</h6>
                  <small className="text-muted">Verified Property Owner · {land.owner_phone || '+91 91234 56789'}</small>
                </div>
              </div>

              <div className="d-grid gap-2">
                <button 
                  className="btn btn-success btn-lg py-3 fw-bold"
                  onClick={() => setShowApplyModal(true)}
                >
                  <i className="bi bi-file-earmark-check me-2"></i> Apply for Lease
                </button>
                <a href={`tel:${land.owner_phone || '9123456789'}`} className="btn btn-outline-success">
                  <i className="bi bi-telephone me-2"></i> Contact Owner
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={showApplyModal}
        title={`Apply for Lease — ${land.land_name}`}
        onClose={() => setShowApplyModal(false)}
        onConfirm={handleApply}
        confirmText={submitting ? 'Submitting...' : 'Submit Application'}
      >
        <div className="mb-3">
          <label className="form-label fw-bold">Proposed Annual Price (₹)</label>
          <input 
            type="number" 
            className="form-control" 
            value={proposedPrice}
            onChange={(e) => setProposedPrice(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">Proposed Lease Duration</label>
          <select 
            className="form-select"
            value={proposedMonths}
            onChange={(e) => setProposedMonths(e.target.value)}
          >
            <option value={12}>12 Months (1 Year)</option>
            <option value={24}>24 Months (2 Years)</option>
            <option value={36}>36 Months (3 Years)</option>
          </select>
          <small className="text-muted mt-1 d-block">
            Estimated Total Lease Value: <strong className="text-success">₹{(Math.round((Number(proposedPrice || 0) * (Number(proposedMonths || 12) / 12)) * 100) / 100).toLocaleString()}</strong>
          </small>
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">Message to Landowner</label>
          <textarea 
            className="form-control" 
            rows="3"
            placeholder="Describe your farming experience and intended crops..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
        </div>
      </Modal>
    </div>
  );
}
