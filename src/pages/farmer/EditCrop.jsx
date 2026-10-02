import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function EditCrop() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  const [formData, setFormData] = useState({
    product_name: '',
    category: 'Grains',
    price_per_unit: '',
    unit: 'kg',
    available_qty: '100',
    location: '',
    description: ''
  });

  useEffect(() => {
    loadCrop();
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [id]);

  const loadCrop = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProductById(id);
      if (data) {
        setFormData({
          product_name: data.product_name || '',
          category: data.category || 'Grains',
          price_per_unit: data.price_per_unit != null ? String(data.price_per_unit) : '',
          unit: data.unit || 'kg',
          available_qty: String(data.available_qty ?? data.quantity ?? '0'),
          location: data.location || '',
          description: data.description || ''
        });
        setExistingImage(data.image_url || null);
      } else {
        setError('Crop listing not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load crop details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPEG, PNG, WebP, GIF).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Selected image is too large. Maximum size is 10 MB.');
      return;
    }
    setError(null);
    setSelectedFile(file);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearSelectedImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!formData.product_name.trim()) {
      setError('Product name is required.');
      return;
    }
    const price = Number(formData.price_per_unit);
    const qty = Number(formData.available_qty);
    if (!Number.isFinite(price) || price <= 0) {
      setError('Price per unit must be a positive number.');
      return;
    }
    if (!Number.isFinite(qty) || qty < 0) {
      setError('Available quantity cannot be negative.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        product_name: formData.product_name.trim(),
        category: formData.category,
        price_per_unit: price,
        unit: formData.unit,
        available_qty: qty,
        quantity: qty,
        location: formData.location.trim(),
        description: formData.description.trim(),
        file: selectedFile
      };

      const result = await api.updateProduct(id, payload);
      if (result && result.success === false) {
        setError(result.message || 'Failed to update produce listing.');
        setSaving(false);
        return;
      }
      navigate('/farmer/my-crops');
    } catch (err) {
      setError(err.message || 'Error saving changes.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading crop details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-crop-page py-4">
      <div className="container" style={{ maxWidth: '850px' }}>
        <div className="mb-4">
          <span className="eyebrow">EDIT PRODUCE LISTING</span>
          <h2 className="fw-black mb-1">Edit Crop — {formData.product_name || 'Produce'}</h2>
          <p className="text-muted small">Update your harvested produce inventory details and pricing.</p>
        </div>

        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="row g-4">
            <div className="col-md-6">
              <label className="form-label fw-bold">Crop / Produce Name *</label>
              <input
                type="text"
                name="product_name"
                required
                className="form-control"
                value={formData.product_name}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Produce Category *</label>
              <select
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="Grains">Grains (Rice / Corn / Wheat)</option>
                <option value="Spices">Spices & Condiments (Chilli / Turmeric)</option>
                <option value="Pulses">Pulses & Lentils (Gram / Dal)</option>
                <option value="Commercial Crops">Commercial Crops (Cotton / Tobacco)</option>
                <option value="Oilseeds">Oilseeds (Groundnut / Sunflower)</option>
                <option value="Vegetables">Fresh Vegetables</option>
                <option value="Fruits">Fresh Seasonal Fruits</option>
                <option value="Organic Produce">Organic Produce</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Price per Unit (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                name="price_per_unit"
                required
                className="form-control"
                value={formData.price_per_unit}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Selling Unit *</label>
              <select
                name="unit"
                className="form-select"
                value={formData.unit}
                onChange={handleChange}
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
              <label className="form-label fw-bold">Available Stock *</label>
              <input
                type="number"
                min="0"
                name="available_qty"
                required
                className="form-control"
                value={formData.available_qty}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-bold">Harvest / Farm Location *</label>
              <input
                type="text"
                name="location"
                required
                className="form-control"
                value={formData.location}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-bold">Description</label>
              <textarea
                name="description"
                className="form-control"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                disabled={saving}
                placeholder="Details about crop quality, harvest date, certifications..."
              ></textarea>
            </div>

            {/* Image Preview & Replacement */}
            <div className="col-12">
              <label className="form-label fw-bold">Produce Photo</label>
              <div className="d-flex flex-wrap gap-3 align-items-center">
                {previewUrl ? (
                  <div className="position-relative" style={{ width: '130px', height: '95px' }}>
                    <img
                      src={previewUrl}
                      alt="New preview"
                      className="rounded-3 shadow-sm"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span className="badge bg-primary position-absolute top-0 start-0 m-1">New</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-0 rounded-circle"
                      style={{ width: '22px', height: '22px', lineHeight: '20px' }}
                      onClick={clearSelectedImage}
                      title="Clear image"
                    >
                      ×
                    </button>
                  </div>
                ) : existingImage ? (
                  <div className="position-relative" style={{ width: '130px', height: '95px' }}>
                    <img
                      src={existingImage}
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
                    onChange={handleImageFileUpload}
                    disabled={saving}
                  />
                  <small className="text-muted d-block mt-1">
                    Upload a new photo to replace existing image (JPEG, PNG, WebP up to 10 MB). Leave blank to keep existing.
                  </small>
                </div>
              </div>
            </div>

            <div className="col-12 d-flex gap-3 pt-2">
              <button
                type="submit"
                className="btn btn-success px-4 py-2 fw-bold d-flex align-items-center gap-2"
                disabled={saving}
              >
                {saving && <span className="spinner-border spinner-border-sm" role="status"></span>}
                <span>{saving ? 'Updating Produce...' : 'Update Produce Listing'}</span>
              </button>
              <button
                type="button"
                className="btn btn-light px-4 py-2"
                onClick={() => navigate('/farmer/my-crops')}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
