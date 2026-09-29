import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function LandCard({ land, onWishlist }) {
  const image = land.images && land.images.length > 0 ? land.images[0] : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800';

  return (
    <div className="land-card">
      <div className="position-relative">
        <img src={image} alt={land.land_name} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"; }} />
        <span className="position-absolute top-0 start-0 m-3 badge bg-white text-dark shadow-sm rounded-pill fw-bold px-3 py-2">
          <i className="bi bi-patch-check-fill text-success me-1"></i> Verified
        </span>
        {onWishlist && (
          <button 
            className="position-absolute top-0 end-0 m-3 btn btn-light btn-sm rounded-circle shadow-sm p-2"
            onClick={() => onWishlist(land)}
          >
            <i className="bi bi-heart text-danger"></i>
          </button>
        )}
      </div>

      <div className="land-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <span className="text-muted small"><i className="bi bi-geo-alt-fill text-danger me-1"></i>{land.location}</span>
            <h5>{land.land_name}</h5>
          </div>
          <StatusBadge status={land.status || 'approved'} />
        </div>

        <div className="d-flex flex-wrap gap-2 my-3">
          <span className="badge bg-light text-secondary border rounded-pill">
            <i className="bi bi-aspect-ratio me-1"></i>{land.acres} Acres
          </span>
          <span className="badge bg-light text-secondary border rounded-pill">
            <i className="bi bi-layers me-1"></i>{land.soil_type}
          </span>
          <span className="badge bg-light text-secondary border rounded-pill">
            <i className="bi bi-droplet-fill text-primary me-1"></i>{land.water_source}
          </span>
        </div>

        <div className="d-flex justify-content-between align-items-center pt-3 border-top">
          <div>
            <span className="text-muted extra-small d-block">Lease Price</span>
            <span className="price-tag">₹{Number(land.lease_price).toLocaleString()}<small className="fs-6 text-muted font-normal">/yr</small></span>
          </div>

          <Link to={`/land/${land.id}`} className="btn btn-success btn-sm px-3">
            View Details <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}
