import React, { useState, useEffect } from 'react';
import StatusBadge from '../../components/StatusBadge';
import { api } from '../../services/api';

export default function LandModeration() {
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLands();
  }, []);

  const loadLands = async () => {
    setLoading(true);
    const data = await api.getLands();
    setLands(data);
    setLoading(false);
  };

  const toggleApprove = (landId) => {
    setLands(lands.map(l => {
      if (l.id === landId) {
        const nextStatus = l.status === 'approved' ? 'rejected' : 'approved';
        return { ...l, status: nextStatus };
      }
      return l;
    }));
  };

  return (
    <div className="admin-lands-page">
      <div className="mb-4">
        <span className="eyebrow">MODERATION WORKFLOW</span>
        <h2 className="fw-black mb-1">Farmland Moderation</h2>
        <p className="text-muted small">Review agricultural land listings and verify property credentials.</p>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Land Name</th>
                  <th>Location</th>
                  <th>Owner</th>
                  <th>Acres</th>
                  <th>Lease Fee</th>
                  <th>Status</th>
                  <th>Moderation</th>
                </tr>
              </thead>
              <tbody>
                {lands.map(l => (
                  <tr key={l.id}>
                    <td>
                      <div className="fw-bold">{l.land_name}</div>
                      <small className="text-muted">{l.soil_type}</small>
                    </td>
                    <td>{l.location}</td>
                    <td>{l.owner_name || 'Venkatesh Rao'}</td>
                    <td>{l.acres} Acres</td>
                    <td className="fw-bold text-success">₹{Number(l.lease_price).toLocaleString()}/yr</td>
                    <td><StatusBadge status={l.status || 'approved'} /></td>
                    <td>
                      <button 
                        className={`btn btn-sm ${l.status === 'approved' ? 'btn-outline-danger' : 'btn-success'}`}
                        onClick={() => toggleApprove(l.id)}
                      >
                        {l.status === 'approved' ? 'Reject Listing' : 'Approve Listing'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
