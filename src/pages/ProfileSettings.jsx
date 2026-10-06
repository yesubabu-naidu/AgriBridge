import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getUserInitial } from '../utils/user';

export default function ProfileSettings({ user, onUpdateProfile }) {
  const role = user?.role || 'farmer';

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || 'Ongole, Andhra Pradesh');
  const [avatar, setAvatar] = useState(user?.avatar || user?.avatar_url || null);
  const [idProofImg, setIdProofImg] = useState(user?.id_proof_img || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600');

  // Role specific fields
  const [farmSize, setFarmSize] = useState(user?.farm_size || '5.5 Acres');
  const [primaryCrops, setPrimaryCrops] = useState(user?.primary_crops || 'Rice, Cotton, Chilli');
  const [companyName, setCompanyName] = useState(user?.company_name || 'AgriTrade Enterprises');
  const [shippingAddress, setShippingAddress] = useState(user?.shipping_address || 'Plot 42, Industrial Area, Vijayawada');

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [successAlert, setSuccessAlert] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || user.avatar_url || null);
      if (user.location) setLocation(user.location);
      if (user.farm_size) setFarmSize(user.farm_size);
      if (user.primary_crops) setPrimaryCrops(user.primary_crops);
      if (user.company_name) setCompanyName(user.company_name);
      if (user.shipping_address) setShippingAddress(user.shipping_address);
    }
  }, [user]);

  if (!user) {
    return <div className="container py-5 text-center"><p>Please login to access profile settings.</p></div>;
  }

  const handleAvatarFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      window.alert("Please choose an image up to 10 MB.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const response = await api.uploadAvatar(file);
      const newAvatar = response?.data?.avatar || response?.data?.avatar_url;
      if (newAvatar) {
        setAvatar(newAvatar);
        const updatedUser = { ...user, avatar: newAvatar, avatar_url: newAvatar };
        localStorage.setItem("agribridge_user", JSON.stringify(updatedUser));
        if (onUpdateProfile) onUpdateProfile(updatedUser);
      } else if (!response?.isMock) {
        window.alert(response?.message || "Avatar upload failed.");
      }
    } catch (err) {
      window.alert(err.message || "Avatar upload failed.");
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    if (!avatar) return;
    if (!window.confirm("Are you sure you want to delete your profile photo?")) {
      return;
    }
    setDeletingAvatar(true);
    try {
      const response = await api.deleteAvatar();
      if (response?.success) {
        setAvatar(null);
        const updatedUser = { ...user, avatar: null, avatar_url: null };
        localStorage.setItem("agribridge_user", JSON.stringify(updatedUser));
        if (onUpdateProfile) onUpdateProfile(updatedUser);
      } else {
        window.alert(response?.message || "Failed to delete profile photo.");
      }
    } catch (err) {
      window.alert(err.message || "Failed to delete profile photo.");
    } finally {
      setDeletingAvatar(false);
    }
  };

  const handleIdProofFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!(file.type.startsWith("image/") || file.type === "application/pdf") || file.size > 10 * 1024 * 1024) {
      window.alert("Please choose a JPG, PNG, WebP, GIF, or PDF up to 10 MB.");
      return;
    }
    setIdProofImg(URL.createObjectURL(file));
    const response = await api.uploadIdProof(file);
    if (response?.data?.id_proof_img) setIdProofImg(response.data.id_proof_img);
    else if (!response?.isMock) window.alert(response?.message || "Identity document upload failed.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const updatedUser = {
      ...user,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      location: location.trim(),
      avatar: avatar || null,
      avatar_url: avatar || null,
      id_proof_img: idProofImg,
      farm_size: farmSize,
      primary_crops: primaryCrops,
      company_name: companyName,
      shipping_address: shippingAddress
    };

    try {
      const response = await api.updateProfile(updatedUser);
      const persistedUser = response?.data?.user || updatedUser;
      localStorage.setItem("agribridge_user", JSON.stringify(persistedUser));
      if (onUpdateProfile) onUpdateProfile(persistedUser);
      setSuccessAlert(true);
      window.setTimeout(() => setSuccessAlert(false), 4000);
    } catch (error) {
      window.alert(error.message || "Unable to save profile settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-settings-page py-4">
      <div className="container" style={{ maxWidth: '960px' }}>
        <div className="mb-4">
          <span className="eyebrow text-uppercase">{role} SETTINGS</span>
          <h2 className="fw-black mb-1">Profile & Account Settings</h2>
          <p className="text-muted small">Manage your personal information, profile photo, and identity verification credentials.</p>
        </div>

        {successAlert && (
          <div className="alert alert-success alert-dismissible fade show rounded-4 mb-4" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i> Your profile details and verification images have been updated successfully!
            <button type="button" className="btn-close" onClick={() => setSuccessAlert(false)}></button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Avatar & Cover Section */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold mb-4">Profile Photo & Identity Verification</h5>
            <div className="row g-4 align-items-center">
              {/* Profile Avatar Upload */}
              <div className="col-md-6">
                <div className="d-flex align-items-center gap-4">
                  <div className="position-relative flex-shrink-0">
                    {avatar ? (
                      <img 
                        src={avatar} 
                        alt="Avatar" 
                        className="rounded-circle border border-3 border-success shadow-sm"
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="rounded-circle border border-3 border-success shadow-sm bg-success text-white d-flex align-items-center justify-content-center fw-bold fs-1"
                        style={{ width: '100px', height: '100px' }}
                      >
                        {getUserInitial(fullName || user.full_name)}
                      </div>
                    )}
                    <label 
                      htmlFor="avatar-upload" 
                      className="position-absolute bottom-0 end-0 bg-success text-white rounded-circle p-2 shadow cursor-pointer d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px' }}
                      title="Upload Avatar Image"
                    >
                      <i className="bi bi-camera-fill extra-small"></i>
                    </label>
                    <input 
                      id="avatar-upload"
                      type="file" 
                      accept="image/*" 
                      className="d-none"
                      onChange={handleAvatarFileUpload}
                      disabled={uploadingAvatar || deletingAvatar}
                    />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">{fullName || user.full_name || 'User'}</h6>
                    <span className="badge bg-success-subtle text-success text-capitalize mb-2">{role}</span>
                    <div className="d-flex flex-wrap gap-2">
                      <label htmlFor="avatar-upload" className={`btn btn-sm btn-outline-success ${uploadingAvatar ? 'disabled' : ''}`}>
                        <i className="bi bi-upload me-1"></i> {uploadingAvatar ? 'Uploading photo...' : 'Upload Photo'}
                      </label>
                      {avatar && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={handleDeleteAvatar}
                          disabled={deletingAvatar || uploadingAvatar}
                        >
                          <i className="bi bi-trash me-1"></i> {deletingAvatar ? 'Deleting photo...' : 'Delete Photo'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Identity Verification Image (Featured for Farmers & Landowners) */}
              {role === 'landowner' && (
                <div className="col-md-6 border-start ps-md-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="fw-bold mb-0">
                        {role === 'landowner' ? 'Patta / Land Title Document' : 'Kisan Passbook / Agri ID'}
                      </h6>
                      <small className="text-muted extra-small">Government verified property document image</small>
                    </div>
                    <span className="badge bg-success text-white rounded-pill px-2 py-1 extra-small">
                      <i className="bi bi-patch-check-fill me-1"></i> Verified
                    </span>
                  </div>

                  <div className="d-flex align-items-center gap-3 mt-2">
                    <img 
                      src={idProofImg} 
                      alt="ID Document" 
                      className="rounded-3 border shadow-sm"
                      style={{ width: '90px', height: '60px', objectFit: 'cover' }}
                    />
                    <label htmlFor="id-proof-upload" className="btn btn-sm btn-light border text-dark">
                      <i className="bi bi-file-earmark-arrow-up me-1"></i> Upload Document
                    </label>
                    <input 
                      id="id-proof-upload"
                      type="file" 
                      accept="image/*" 
                      className="d-none"
                      onChange={handleIdProofFileUpload}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold mb-3">Personal & Contact Information</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-bold">Full Name *</label>
                <input 
                  type="text" 
                  required 
                  className="form-control" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold">Email Address *</label>
                <input 
                  type="email" 
                  required 
                  className="form-control" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold">Phone Number *</label>
                <input 
                  type="tel" 
                  required 
                  className="form-control" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-bold">Location / District *</label>
                <input 
                  type="text" 
                  required 
                  className="form-control" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Role-Specific Fields */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold mb-3 text-capitalize">{role} Specific Credentials</h5>

            {role === 'farmer' && (
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Total Cultivated Farm Size</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    placeholder="e.g. 5.5 Acres"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Primary Crops Grown</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={primaryCrops}
                    onChange={(e) => setPrimaryCrops(e.target.value)}
                    placeholder="e.g. Rice, Cotton, Chilli"
                  />
                </div>
              </div>
            )}

            {role === 'landowner' && (
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Total Land Portfolio (Acres)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    placeholder="e.g. 25 Acres"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Primary Agricultural Districts</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Prakasam, Guntur"
                  />
                </div>
              </div>
            )}

            {role === 'buyer' && (
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Company / Business Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="AgriTrade Enterprises"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Default Shipping Address</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                  />
                </div>
              </div>
            )}

            {role === 'admin' && (
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Administrative Role Level</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value="Senior Platform Administrator"
                    readOnly
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Security Clearance</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value="Full System Audit & Moderation Privileges"
                    readOnly
                  />
                </div>
              </div>
            )}
          </div>

          <div className="d-flex gap-3">
            <button type="submit" className="btn btn-success px-5 py-3 fw-bold" disabled={saving}>
              {saving ? (
                <span><span className="spinner-border spinner-border-sm me-2"></span> Saving Profile...</span>
              ) : (
                <span><i className="bi bi-check-circle me-2"></i> Save Profile Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
