import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { api } from '../../services/api';

export default function MyCrops() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const user = (() => {
    try {
      return JSON.parse(
        localStorage.getItem('agribridge_user') || 'null'
      );
    } catch {
      return null;
    }
  })();

  const userEmail = String(user?.email || '').toLowerCase();

  useEffect(() => {
    loadCrops();
  }, []);

  const loadCrops = async () => {
    setLoading(true);

    const allProducts = await api.getMyProducts();

    if (user) {
      const myCropsList = allProducts.filter(
        (p) =>
          String(p.farmer_id) === String(user.id) ||
          (p.farmer_email &&
            p.farmer_email.toLowerCase() === userEmail) ||
          (p.created_by &&
            p.created_by.toLowerCase() === userEmail)
      );

      setCrops(myCropsList);
    } else {
      setCrops([]);
    }

    setLoading(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await api.deleteProduct(deleteId);

      setDeleteId(null);
      loadCrops();
    }
  };

  return (
    <div className="my-crops-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <span className="eyebrow">
            HARVEST INVENTORY
          </span>

          <h2 className="fw-black mb-1">
            My Crop Produce
          </h2>

          <p className="text-muted small">
            Manage your listed produce items for commercial buyers.
          </p>
        </div>

        <Link
          to="/farmer/add-crop"
          className="btn btn-success"
        >
          <i className="bi bi-plus-lg me-1"></i>
          Add Crop Produce
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success"></div>
        </div>
      ) : crops.length === 0 ? (
        <EmptyState
          icon="bi-shop"
          title="No Crop Produce Listed Yet"
          description="You haven't listed any harvested crops or produce yet. Click 'Add Crop Produce' to list your produce."
          actionText="Add Crop Produce"
          actionLink="/farmer/add-crop"
        />
      ) : (
        <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr className="text-muted small">
                  <th>Produce Name</th>
                  <th>Category</th>
                  <th>Stock Available</th>
                  <th>Price per Unit</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {crops.map((crop) => (
                  <tr key={crop.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={
                            crop.image_url ||
                            'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800'
                          }
                          alt=""
                          className="rounded-3"
                          style={{
                            width: '50px',
                            height: '40px',
                            objectFit: 'cover'
                          }}
                        />

                        <span className="fw-bold">
                          {crop.product_name}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="badge bg-success-subtle text-success">
                        {crop.category}
                      </span>
                    </td>

                    <td className="fw-bold">
                      {crop.available_qty ?? crop.quantity ?? 0}{' '}
                      {crop.unit}
                    </td>

                    <td className="fw-bold text-success">
                      ₹{crop.price_per_unit} / {crop.unit}
                    </td>

                    <td className="small text-muted">
                      {crop.location}
                    </td>

                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setDeleteId(crop.id)}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={Boolean(deleteId)}
        title="Confirm Removal"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        confirmText="Remove Crop"
        confirmVariant="danger"
      >
        <p className="mb-0">
          Are you sure you want to remove this crop listing from the
          produce store?
        </p>
      </Modal>
    </div>
  );
}