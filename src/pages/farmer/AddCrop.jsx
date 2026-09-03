import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export default function AddCrop() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const savedUser = localStorage.getItem('agribridge_user');
  const user = savedUser ? JSON.parse(savedUser) : null;

  const [formData, setFormData] = useState({
    product_name: '',
    category: 'Grains',
    price_per_unit: '',
    unit: 'kg',
    quantity: '100',
    location: user && user.location ? user.location : 'Ongole, Andhra Pradesh',
    description: '',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image_url: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const newProduct = {
      id: Date.now(),
      farmer_id: user ? user.id : 1,
      farmer_name: user ? user.full_name : 'Ramesh Babu',
      farmer_email: user ? user.email : 'farmer@agribridge.com',
      created_by: user ? user.email : 'farmer@agribridge.com',
      product_name: formData.product_name,
      category: formData.category,
      price_per_unit: Number(formData.price_per_unit),
      unit: formData.unit,
      quantity: Number(formData.quantity),
      location: formData.location,
      description: formData.description,
      image_url: formData.image_url,
      rating: 5.0
    };

    // Save to products store via API
    await api.createProduct(newProduct);

    setSubmitting(false);
    navigate('/farmer/my-crops');
  };

  return (
    <div className="add-crop-page py-4">
      <div className="container" style={{ maxWidth: '850px' }}>
        <div className="mb-4">
          <span className="eyebrow">FARM PRODUCE LISTING</span>
          <h2 className="fw-black mb-1">Add Crop Produce for Sale</h2>
          <p className="text-muted small">List your harvested crops, grains, and vegetables to sell directly to commercial buyers.</p>
        </div>

        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <form onSubmit={handleSubmit} className="row g-4">
            <div className="col-md-6">
              <label className="form-label fw-bold">Crop / Produce Name *</label>
              <input 
                type="text" 
                name="product_name" 
                required 
                className="form-control" 
                placeholder="e.g. Organic Sona Masoori Rice"
                value={formData.product_name}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-bold">Produce Category *</label>
              <select name="category" className="form-select" value={formData.category} onChange={handleChange}>
                <option value="Grains">Grains (Rice / Corn / Wheat)</option>
                <option value="Spices">Spices (Chilli / Turmeric / Pepper)</option>
                <option value="Vegetables">Vegetables (Tomatoes / Onions)</option>
                <option value="Fruits">Fruits (Mangoes / Bananas)</option>
                <option value="Fiber">Fiber (Cotton / Jute)</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Price per Unit (₹) *</label>
              <input 
                type="number" 
                name="price_per_unit" 
                required 
                className="form-control" 
                placeholder="65"
                value={formData.price_per_unit}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Unit Type *</label>
              <select name="unit" className="form-select" value={formData.unit} onChange={handleChange}>
                <option value="kg">kg (Kilogram)</option>
                <option value="quintal">quintal (100 kg)</option>
                <option value="bag">bag (50 kg)</option>
                <option value="ton">ton (1000 kg)</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Total Available Stock *</label>
              <input 
                type="number" 
                name="quantity" 
                required 
                className="form-control" 
                placeholder="500"
                value={formData.quantity}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-bold">Location / Origin *</label>
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

            {/* Crop Image Upload Section */}
            <div className="col-12">
              <label className="form-label fw-bold d-block">Crop Photo Upload *</label>
              <div className="p-3 border rounded-3 bg-light">
                <div className="d-flex align-items-center gap-3">
                  <img 
                    src={formData.image_url} 
                    alt="Crop Preview" 
                    className="rounded-3 border shadow-sm"
                    style={{ width: '120px', height: '90px', objectFit: 'cover' }}
                  />
                  <div className="flex-grow-1">
                    <label htmlFor="crop-img-file" className="btn btn-outline-success btn-sm me-2 mb-2">
                      <i className="bi bi-upload me-1"></i> Upload Image File
                    </label>
                    <input 
                      id="crop-img-file" 
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
              <label className="form-label fw-bold">Crop Description *</label>
              <textarea 
                name="description" 
                required 
                className="form-control" 
                rows="4" 
                placeholder="Describe organic certification, moisture level, harvest date, packaging details..."
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="col-12 d-flex gap-3 mt-4">
              <button type="submit" className="btn btn-success px-5 py-2 fw-bold" disabled={submitting}>
                {submitting ? 'Publishing...' : 'Publish Produce Item'}
              </button>
              <button type="button" className="btn btn-light px-4" onClick={() => navigate('/farmer/my-crops')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
