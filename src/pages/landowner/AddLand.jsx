import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function AddLand() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const savedUser = localStorage.getItem('agribridge_user');
  const user = savedUser ? JSON.parse(savedUser) : null;

  const [formData, setFormData] = useState({
    land_name: '',
    location: '',
    district: '',
    state: 'Andhra Pradesh',
    acres: '',
    soil_type: 'Black Soil',
    water_source: 'Borewell',
    electricity: 'yes',
    road_access: 'yes',
    suitable_crops: '',
    lease_price: '',
    lease_duration_months: 12,
    description: '',
    image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      window.alert("Please choose an image up to 10 MB.");
      return;
    }
    setSelectedFile(file);
    setFormData((current) => ({ ...current, image_url: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const landToSave = {
      ...formData,
      image_url: selectedFile ? "" : formData.image_url,
      landowner_id: user ? user.id : null,
      owner_name: user ? user.full_name : 'Venkatesh Rao',
      owner_email: user ? user.email : 'landowner@agribridge.com',
      created_by: user ? user.email : 'landowner@agribridge.com',
      owner_phone: user ? user.phone : '+91 91234 56789',
      file: selectedFile
    };

    const result = await api.createLand(landToSave);
    setSubmitting(false);
    if (!result?.success || result.isMock) {
      window.alert(result?.message || "The land was not saved to the database. Please check the server connection and try again.");
      return;
    }
    navigate('/landowner/my-lands');
  };

  return (
    <div className="add-land-page">
      <div className="mb-4">
        <span className="eyebrow">PROPERTY LISTING</span>
        <h2 className="fw-black mb-1">Add New Land</h2>
        <p className="text-muted small">Publish your agricultural land listing to receive lease applications from farmers.</p>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ maxWidth: '900px' }}>
        <form onSubmit={handleSubmit} className="row g-4">
          <div className="col-md-6">
            <label className="form-label fw-bold">Land Name *</label>
            <input 
              type="text" 
              name="land_name" 
              required 
              className="form-control" 
              placeholder="e.g. Green Valley Farm"
              value={formData.land_name}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Location / Village *</label>
            <input 
              type="text" 
              name="location" 
              required 
              className="form-control" 
              placeholder="e.g. Ongole, Andhra Pradesh"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-bold">District *</label>
            <input 
              type="text" 
              name="district" 
              required 
              className="form-control" 
              placeholder="Prakasam"
              value={formData.district}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-bold">State</label>
            <input 
              type="text" 
              name="state" 
              className="form-control" 
              value={formData.state}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-bold">Size in Acres *</label>
            <input 
              type="number" 
              step="0.1" 
              name="acres" 
              required 
              className="form-control" 
              placeholder="5.2"
              value={formData.acres}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Soil Type *</label>
            <select name="soil_type" className="form-select" value={formData.soil_type} onChange={handleChange}>
              <option value="Black Soil">Black Soil</option>
              <option value="Alluvial Soil">Alluvial Soil</option>
              <option value="Red Sandy Loam">Red Sandy Loam</option>
              <option value="Black Cotton Soil">Black Cotton Soil</option>
              <option value="Red Soil">Red Soil</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Water Source *</label>
            <input 
              type="text" 
              name="water_source" 
              required 
              className="form-control" 
              placeholder="Borewell / Canal"
              value={formData.water_source}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Electricity Connection</label>
            <select name="electricity" className="form-select" value={formData.electricity} onChange={handleChange}>
              <option value="yes">Yes (Available)</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Road Access</label>
            <select name="road_access" className="form-select" value={formData.road_access} onChange={handleChange}>
              <option value="yes">Yes (Tar Road / Connected)</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Suitable Crops</label>
            <input 
              type="text" 
              name="suitable_crops" 
              className="form-control" 
              placeholder="Cotton, Chilli, Groundnut"
              value={formData.suitable_crops}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold">Annual Lease Price (₹) *</label>
            <input 
              type="number" 
              name="lease_price" 
              required 
              className="form-control" 
              placeholder="40000"
              value={formData.lease_price}
              onChange={handleChange}
            />
          </div>

          {/* Property Image Upload Section */}
          <div className="col-12">
            <label className="form-label fw-bold d-block">Property Image Upload *</label>
            <div className="p-3 border rounded-3 bg-light">
              <div className="d-flex align-items-center gap-3">
                <img 
                  src={formData.image_url} 
                  alt="Land Preview" 
                  className="rounded-3 border shadow-sm"
                  style={{ width: '130px', height: '90px', objectFit: 'cover' }}
                />
                <div className="flex-grow-1">
                  <label htmlFor="land-img-file" className="btn btn-outline-success btn-sm me-2 mb-2">
                    <i className="bi bi-upload me-1"></i> Upload Image File
                  </label>
                  <input 
                    id="land-img-file" 
                    type="file" 
                    accept="image/*" 
                    className="d-none"
                    onChange={handleImageFileUpload}
                  />
                  <div className="mt-1">
                    <small className="text-muted extra-small d-block mb-1">Or paste Image URL:</small>
                    <input 
                      type="url" 
                      name="image_url" 
                      className="form-control form-control-sm" 
                      placeholder="https://..."
                      value={formData.image_url}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <label className="form-label fw-bold">Description *</label>
            <textarea 
              name="description" 
              required 
              className="form-control" 
              rows="4" 
              placeholder="Describe soil condition, water availability, fencing, nearby markets..."
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="col-12 d-flex gap-3 mt-4">
            <button type="submit" className="btn btn-success px-5 py-2 fw-bold" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish Land'}
            </button>
            <button type="button" className="btn btn-light px-4" onClick={() => navigate('/landowner/my-lands')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
