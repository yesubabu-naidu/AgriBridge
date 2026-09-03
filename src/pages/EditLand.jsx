import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function EditLand() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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
  }, [id]);

  const loadLand = async () => {
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
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.updateLand(id, formData);
    navigate('/landowner/my-lands');
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-success"></div></div>;

  return (
    <div className="edit-land-page">
      <div className="mb-4">
        <span className="eyebrow">EDIT LISTING</span>
        <h2 className="fw-black mb-1">Edit Land — {formData.land_name}</h2>
        <p className="text-muted small">Update your agricultural property details and lease pricing.</p>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit} className="row g-4">
          <div className="col-md-6">
            <label className="form-label fw-bold">Land Name</label>
            <input type="text" name="land_name" required className="form-control" value={formData.land_name} onChange={handleChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Location</label>
            <input type="text" name="location" required className="form-control" value={formData.location} onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-bold">Acres</label>
            <input type="number" step="0.1" name="acres" required className="form-control" value={formData.acres} onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-bold">Soil Type</label>
            <input type="text" name="soil_type" required className="form-control" value={formData.soil_type} onChange={handleChange} />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-bold">Annual Price (₹)</label>
            <input type="number" name="lease_price" required className="form-control" value={formData.lease_price} onChange={handleChange} />
          </div>
          <div className="col-12">
            <label className="form-label fw-bold">Description</label>
            <textarea name="description" required className="form-control" rows="4" value={formData.description} onChange={handleChange}></textarea>
          </div>
          <div className="col-12 d-flex gap-3">
            <button type="submit" className="btn btn-success px-4 fw-bold">Save Changes</button>
            <button type="button" className="btn btn-light px-4" onClick={() => navigate('/landowner/my-lands')}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
