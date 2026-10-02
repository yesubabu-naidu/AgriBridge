import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function EditLand() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [formData, setFormData] = useState({
    land_name: '',
    location: '',
    acres: '',
    soil_type: 'Black Soil',
    lease_price: '',
    description: ''
  });

  useEffect(() => {
    loadLand();
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [id]);

  const loadLand = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getLandById(id);
      if (data) {
        setFormData({
          land_name: data.land_name || '',
          location: data.location || '',
          acres: data.acres || '',
          soil_type: data.soil_type || 'Black Soil',
          lease_price: data.lease_price || '',
          description: data.description || ''
        });
        const img = (data.images && data.images[0]) || data.image_url;
        setExistingImage(img || null);
      } else {
        setError('Land listing not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load land details.');
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
      setError('Please select a valid image file (JPEG, PNG, WebP, GIF).');
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

    if (!formData.land_name.trim() || !formData.location.trim()) {
      setError('Land name and location are required.');
      return;
    }
    if (Number(formData.acres) <= 0 || Number(formData.lease_price) <= 0) {
      setError('Acres and annual price must be positive numbers.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const payload = {
        ...formData,
        file: selectedFile
      };
      const result = await api.updateLand(id, payload);
      if (result && result.success === false) {
        setError(result.message || 'Failed to update land listing.');
        setSaving(false);
        return;
      }
      navigate('/landowner/my-lands');
    } catch (err) {
      setError(err.message || 'An error occurred while saving changes.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading land details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-land-page">
      <div className="mb-4">
        <span className="eyebrow">EDIT LISTING</span>
        <h2 className="fw-black mb-1">Edit Land — {formData.land_name || 'Listing'}</h2>
        <p className="text-muted small">Update your agricultural property details and lease pricing.</p>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ maxWidth: '800px' }}>
        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="row g-4">
          <div className="col-md-6">
            <label className="form-label fw-bold">Land Name *</label>
            <input
              type="text"
              name="land_name"
              required
              className="form-control"
              value={formData.land_name}
              onChange={handleChange}
              disabled={saving}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Location *</label>
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
          <div className="col-md-4">
            <label className="form-label fw-bold">Acres *</label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              name="acres"
              required
              className="form-control"
              value={formData.acres}
              onChange={handleChange}
              disabled={saving}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-bold">Soil Type *</label>
            <select
              name="soil_type"
              required
              className="form-select"
              value={formData.soil_type}
              onChange={handleChange}
              disabled={saving}
            >
              <option value="Black Soil">Black Soil</option>
              <option value="Red Soil">Red Soil</option>
              <option value="Alluvial Soil">Alluvial Soil</option>
              <option value="Clayey Loam">Clayey Loam</option>
              <option value="Sandy Loam">Sandy Loam</option>
              <option value="Laterite Soil">Laterite Soil</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label fw-bold">Annual Lease Price (₹) *</label>
            <input
              type="number"
              min="1"
              name="lease_price"
              required
              className="form-control"
              value={formData.lease_price}
              onChange={handleChange}
              disabled={saving}
            />
          </div>
          <div className="col-12">
            <label className="form-label fw-bold">Description</label>
            <textarea
              name="description"
              required
              className="form-control"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              disabled={saving}
            ></textarea>
          </div>

          {/* Image Upload & Previews */}
          <div className="col-12">
            <label className="form-label fw-bold">Property Image</label>
            <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
              {previewUrl ? (
                <div className="position-relative" style={{ width: '140px', height: '100px' }}>
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
                    title="Remove selected image"
                  >
                    ×
                  </button>
                </div>
              ) : existingImage ? (
                <div className="position-relative" style={{ width: '140px', height: '100px' }}>
                  <img
                    src={existingImage}
                    alt="Current property"
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
                  Upload a new image to replace current property photo (JPEG, PNG, WebP up to 10 MB). Leave empty to keep existing image.
                </small>
              </div>
            </div>
          </div>

          <div className="col-12 d-flex gap-3 pt-2">
            <button
              type="submit"
              className="btn btn-success px-4 fw-bold d-flex align-items-center gap-2"
              disabled={saving}
            >
              {saving && <span className="spinner-border spinner-border-sm" role="status"></span>}
              <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
            <button
              type="button"
              className="btn btn-light px-4"
              onClick={() => navigate('/landowner/my-lands')}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
