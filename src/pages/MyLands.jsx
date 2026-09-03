import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { api } from '../../services/api';

export default function MyLands() {
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const savedUser = localStorage.getItem('agribridge_user');
  const user = savedUser ? JSON.parse(savedUser) : null;

  useEffect(() => {
    loadLands();
  }, []);

  const loadLands = async () => {
    setLoading(true);
    const allLands = await api.getLands();

    if (user) {
      const myLandsList = allLands.filter(l => 
        (l.owner_email && l.owner_email.toLowerCase() === user.email.toLowerCase()) ||
        (l.created_by && l.created_by.toLowerCase() === user.email.toLowerCase()) ||
        (l.owner_name && user.full_name && l.owner_name.toLowerCase() === user.full_name.toLowerCase()) ||
        String(l.owner_id) === String(user.id)
      );
      setLands(myLandsList.length > 0 ? myLandsList : allLands);
    } else {
      setLands(allLands);
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await api.deleteLand(deleteId);
      setDeleteId(null);
      loadLands();
    }
  };

  return (
    <div className="my-lands-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <span className="eyebrow">PROPERTY PORTFOLIO</span>
          <h2 className="fw-black mb-1">My Lands</h2>
          <p className="text-muted small">Manage your agricultural land listings and operational parameters.</p>
        </div>
        <Link to="/landowner/add-land" className="btn btn-success">
          <i className="bi bi-plus-lg me-1"></i> Add New Land
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-success"></div></div>
      ) : lands.length === 0 ? (
        <EmptyState
          icon="bi-map"
          title="No Lands Listed Yet"
          description="You haven't published any land listings yet. Add your first property to receive lease requests."
          actionText="Add Your First Land"
          actionLink="/landowner/add-land"
        />
      ) : (
        <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Land Name</th>
                  <th>Location</th>
                  <th>Acreage</th>
                  <th>Soil & Water</th>
                  <th>Lease Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lands.map(land => (
                  <tr key={land.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img 
                          src={land.image_url || (land.images ? land.images[0] : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800')} 
                          alt="" 
                          className="rounded-3" 
                          style={{ width: '50px', height: '40px', objectFit: 'cover' }} 
                        />
                        <span className="fw-bold">{land.land_name}</span>
                      </div>
                    </td>
                    <td>{land.location}</td>
                    <td>{land.acres} Acres</td>
                    <td>{land.soil_type} · {land.water_source}</td>
                    <td className="fw-bold text-success">₹{Number(land.lease_price).toLocaleString()}/yr</td>
                    <td><StatusBadge status={land.status || 'approved'} /></td>
                    <td>
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeleteId(land.id)}
                        >
                          <i className="bi bi-trash me-1"></i> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteId)}
        title="Confirm Deletion"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        confirmText="Delete Land"
        confirmVariant="danger"
      >
        <p className="mb-0">Are you sure you want to delete this land listing? This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
