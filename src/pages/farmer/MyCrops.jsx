import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import { api } from '../../services/api';

export default function MyCrops() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [editingCrop, setEditingCrop] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editForm, setEditForm] = useState({
    product_name: '',
    category: 'Grains',
    price_per_unit: '',
    unit: 'kg',
    available_qty: '',
    location: '',
    description: ''
  });

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

  const handleStartEdit = (crop) => {
    setEditingCrop(crop);
    setEditError(null);
    setEditFile(null);
    setEditImagePreview(null);
    setEditForm({
      product_name: crop.product_name || '',
      category: crop.category || 'Grains',
      price_per_unit: crop.price_per_unit != null ? String(crop.price_per_unit) : '',
      unit: crop.unit || 'kg',
      available_qty: (crop.available_qty ?? crop.quantity) != null ? String(crop.available_qty ?? crop.quantity) : '',
      location: crop.location || '',
      description: crop.description || ''
    });
  };

  const handleCloseEdit = () => {
    if (saving) return;
    if (editImagePreview && editImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditingCrop(null);
    setEditFile(null);
    setEditImagePreview(null);
    setEditError(null);
  };

  const handleEditFormChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setEditError('Please select a valid image file (JPEG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setEditError('Selected image is too large. Maximum size is 10 MB.');
      return;
    }
    setEditError(null);
    setEditFile(file);
    if (editImagePreview && editImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditImagePreview(URL.createObjectURL(file));
  };

  const clearEditImage = () => {
    if (editImagePreview && editImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditFile(null);
    setEditImagePreview(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (saving || !editingCrop) return;

    if (!editForm.product_name.trim()) {
      setEditError('Crop / produce name is required.');
      return;
    }
    const price = Number(editForm.price_per_unit);
    const qty = Number(editForm.available_qty);
    if (!Number.isFinite(price) || price <= 0) {
      setEditError('Price per unit must be a positive number.');
      return;
    }
    if (!Number.isFinite(qty) || qty < 0) {
      setEditError('Available quantity cannot be negative.');
      return;
    }

    try {
      setSaving(true);
      setEditError(null);
      const payload = {
        product_name: editForm.product_name.trim(),
        category: editForm.category,
        price_per_unit: price,
        unit: editForm.unit,
        available_qty: qty,
        quantity: qty,
        location: editForm.location.trim(),
        description: editForm.description.trim(),
        file: editFile
      };

      const res = await api.updateProduct(editingCrop.id, payload);
      if (res && res.success === false) {
        setEditError(res.message || 'Failed to update produce listing.');
        setSaving(false);
        return;
      }

      // Update frontend state immediately with real updated data
      const updatedProduct = res?.data || {
        ...editingCrop,
        ...payload,
        available_qty: qty,
        quantity: qty,
        image_url: editImagePreview || editingCrop.image_url
      };

      setCrops((prev) =>
        prev.map((c) => (c.id === editingCrop.id ? { ...c, ...updatedProduct } : c))
      );

      handleCloseEdit();
      setSuccessMsg(`"${updatedProduct.product_name}" updated successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setEditError(err.message || 'Error occurred while saving crop updates.');
    } finally {
      setSaving(false);
    }
  };

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

      {successMsg && (
        <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2 fs-5"></i>
          <div>{successMsg}</div>
        </div>
      )}

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
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => handleStartEdit(crop)}
                        >
                          <i className="bi bi-pencil me-1"></i>
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeleteId(crop.id)}
                        >
                          <i className="bi bi-trash me-1"></i>
                          Remove
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

      {/* Edit Crop Modal */}
      {editingCrop && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
          role="dialog"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-success text-white border-0 py-3 px-4">
                <h5 className="modal-title fw-bold mb-0">
                  <i className="bi bi-pencil-square me-2"></i>
                  Edit Crop Produce — {editingCrop.product_name}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={handleCloseEdit}
                  disabled={saving}
                ></button>
              </div>

              <form onSubmit={handleSaveEdit}>
                <div className="modal-body p-4">
                  {editError && (
                    <div className="alert alert-danger d-flex align-items-center mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                      <div>{editError}</div>
                    </div>
                  )}

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Crop / Produce Name *</label>
                      <input
                        type="text"
                        name="product_name"
                        required
                        className="form-control"
                        value={editForm.product_name}
                        onChange={handleEditFormChange}
                        disabled={saving}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Category *</label>
                      <select
                        name="category"
                        required
                        className="form-select"
                        value={editForm.category}
                        onChange={handleEditFormChange}
                        disabled={saving}
                      >
                        <option value="Grains">Grains (Rice / Wheat / Corn)</option>
                        <option value="Vegetables">Fresh Vegetables</option>
                        <option value="Fruits">Seasonal Fruits</option>
                        <option value="Pulses">Pulses & Lentils</option>
                        <option value="Spices">Spices & Condiments</option>
                        <option value="Oilseeds">Oilseeds & Mustard</option>
                        <option value="Commercial Crops">Commercial Crops</option>
                        <option value="Organic Produce">Organic Produce</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold small">Price per Unit (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.1"
                        name="price_per_unit"
                        required
                        className="form-control"
                        value={editForm.price_per_unit}
                        onChange={handleEditFormChange}
                        disabled={saving}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold small">Unit *</label>
                      <select
                        name="unit"
                        required
                        className="form-select"
                        value={editForm.unit}
                        onChange={handleEditFormChange}
                        disabled={saving}
                      >
                        <option value="kg">kg (Kilogram)</option>
                        <option value="quintal">quintal (100 kg)</option>
                        <option value="ton">ton (1,000 kg)</option>
                        <option value="box">box</option>
                        <option value="bag">bag</option>
                        <option value="crate">crate</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-bold small">Available Stock *</label>
                      <input
                        type="number"
                        min="0"
                        name="available_qty"
                        required
                        className="form-control"
                        value={editForm.available_qty}
                        onChange={handleEditFormChange}
                        disabled={saving}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold small">Farm / Harvest Location *</label>
                      <input
                        type="text"
                        name="location"
                        required
                        className="form-control"
                        value={editForm.location}
                        onChange={handleEditFormChange}
                        disabled={saving}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold small">Description</label>
                      <textarea
                        name="description"
                        className="form-control"
                        rows="3"
                        value={editForm.description}
                        onChange={handleEditFormChange}
                        disabled={saving}
                        placeholder="Details about harvest freshness, quality, variety..."
                      ></textarea>
                    </div>

                    {/* Image Upload & Preview */}
                    <div className="col-12">
                      <label className="form-label fw-bold small">Produce Image</label>
                      <div className="d-flex flex-wrap gap-3 align-items-center">
                        {editImagePreview ? (
                          <div className="position-relative" style={{ width: '120px', height: '90px' }}>
                            <img
                              src={editImagePreview}
                              alt="New preview"
                              className="rounded-3 shadow-sm"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <span className="badge bg-primary position-absolute top-0 start-0 m-1">New</span>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-0 rounded-circle"
                              style={{ width: '20px', height: '20px', lineHeight: '18px' }}
                              onClick={clearEditImage}
                              title="Clear new image"
                            >
                              ×
                            </button>
                          </div>
                        ) : editingCrop.image_url ? (
                          <div className="position-relative" style={{ width: '120px', height: '90px' }}>
                            <img
                              src={editingCrop.image_url}
                              alt="Current produce"
                              className="rounded-3 shadow-sm"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <span className="badge bg-secondary position-absolute top-0 start-0 m-1">Current</span>
                          </div>
                        ) : null}

                        <div className="flex-grow-1">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="form-control"
                            onChange={handleEditFileChange}
                            disabled={saving}
                          />
                          <small className="text-muted d-block mt-1">
                            Choose a new photo to replace current image (JPEG, PNG, WebP up to 10 MB). Leave empty to keep existing image.
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light border-0 py-3 px-4 d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCloseEdit}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success fw-bold d-flex align-items-center gap-2"
                    disabled={saving}
                  >
                    {saving && <span className="spinner-border spinner-border-sm" role="status"></span>}
                    <span>{saving ? 'Updating Produce...' : 'Update Crop Produce'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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