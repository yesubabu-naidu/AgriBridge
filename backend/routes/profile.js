import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { deleteObject, makePublicId, uploadBuffer, validateUpload } from '../services/storageService.js';

const router = express.Router();

async function getAvatarColumn() {
  const columns = await query('SHOW COLUMNS FROM users');
  const names = new Set(columns.map((column) => column.Field));
  if (names.has('avatar_url')) return 'avatar_url';
  if (names.has('avatar')) return 'avatar';
  throw new Error('The users table must contain avatar or avatar_url.');
}

router.put("/", authenticateToken, async (req, res) => {
  try {
    const { full_name, email, phone, location, farm_size, primary_crops, company_name, shipping_address } = req.body;
    const cleanName = String(full_name || "").trim();
    const cleanEmail = String(email || "").toLowerCase().trim();
    if (!cleanName || !cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({ success: false, message: "Name and a valid email address are required." });
    }

    const users = await query("SELECT id, role, name AS full_name, email, phone, avatar_url AS avatar FROM users WHERE id = ?", [req.user.id]);
    if (!users.length) return res.status(404).json({ success: false, message: "User not found." });
    const duplicate = await query("SELECT id FROM users WHERE email = ? AND id <> ?", [cleanEmail, req.user.id]);
    if (duplicate.length) return res.status(409).json({ success: false, message: "That email address is already in use." });

    await query("UPDATE users SET name = ?, full_name = ?, email = ?, phone = ?, location = ? WHERE id = ?", [cleanName, cleanName, cleanEmail, String(phone || "").trim(), location || null, req.user.id]);
    const role = users[0].role;
    if (role === "farmer") {
      const acres = Number.parseFloat(String(farm_size || "").replace(/[^0-9.]/g, "")) || 0;
      const profiles = await query("SELECT id FROM farmer_profiles WHERE user_id = ?", [req.user.id]);
      if (profiles.length) await query("UPDATE farmer_profiles SET farm_size_acres = ?, primary_crops = ?, location = ? WHERE user_id = ?", [acres, primary_crops || "", location || "", req.user.id]);
      else await query("INSERT INTO farmer_profiles (user_id, farm_size_acres, primary_crops, location) VALUES (?, ?, ?, ?)", [req.user.id, acres, primary_crops || "", location || ""]);
    } else if (role === "buyer") {
      const profiles = await query("SELECT id FROM buyer_profiles WHERE user_id = ?", [req.user.id]);
      if (profiles.length) await query("UPDATE buyer_profiles SET company_name = ?, shipping_address = ? WHERE user_id = ?", [company_name || "", shipping_address || "", req.user.id]);
      else await query("INSERT INTO buyer_profiles (user_id, company_name, shipping_address) VALUES (?, ?, ?)", [req.user.id, company_name || "", shipping_address || ""]);
    } else if (role === "landowner") {
      const acres = Number.parseFloat(String(farm_size || "").replace(/[^0-9.]/g, "")) || 0;
      await query("UPDATE landowner_profiles SET total_land_acres = ? WHERE user_id = ?", [acres, req.user.id]);
    }

    return res.json({ success: true, message: "Profile updated successfully.", data: { user: { ...users[0], full_name: cleanName, email: cleanEmail, phone: String(phone || "").trim(), location, farm_size, primary_crops, company_name, shipping_address } } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/avatar', authenticateToken, upload.single('file'), async (req, res) => {
  let uploadedAsset;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'An avatar image is required.' });
    validateUpload(req.file);
    const avatarColumn = await getAvatarColumn();
    const users = await query("SELECT " + avatarColumn + ", avatar_cloudinary_public_id, avatar_cloudinary_resource_type FROM users WHERE id = ?", [req.user.id]);
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found.' });
    uploadedAsset = await uploadBuffer({
      publicId: makePublicId({ scope: 'avatars', ownerId: req.user.id, recordId: req.user.id, originalName: req.file.originalname }),
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      originalName: req.file.originalname
    });
    await query("UPDATE users SET " + avatarColumn + " = ?, avatar_cloudinary_public_id = ?, avatar_cloudinary_resource_type = ?, avatar_original_file_name = ?, avatar_mime_type = ?, avatar_file_size = ?, avatar_storage_provider = ? WHERE id = ?", [uploadedAsset.url, uploadedAsset.publicId, uploadedAsset.resourceType, req.file.originalname, req.file.mimetype, req.file.size, 'cloudinary', req.user.id]);
    if (users[0].avatar_cloudinary_public_id) {
      try { await deleteObject(users[0].avatar_cloudinary_public_id, users[0].avatar_cloudinary_resource_type); } catch (error) { console.error('Previous avatar cleanup failed:', error.message); }
    }
    return res.json({ success: true, data: { avatar: uploadedAsset.url, avatar_cloudinary_public_id: uploadedAsset.publicId } });
  } catch (error) {
    if (uploadedAsset) {
      try { await deleteObject(uploadedAsset.publicId, uploadedAsset.resourceType); } catch {}
    }
    return res.status(error.code === 'INVALID_FILE_TYPE' || error.code === 'FILE_TOO_LARGE' ? 400 : error.code === 'STORAGE_NOT_CONFIGURED' ? 503 : 500).json({ success: false, message: error.message });
  }
});

router.delete('/avatar', authenticateToken, async (req, res) => {
  try {
    const avatarColumn = await getAvatarColumn();
    const users = await query("SELECT " + avatarColumn + ", avatar_cloudinary_public_id, avatar_cloudinary_resource_type FROM users WHERE id = ?", [req.user.id]);
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found.' });
    await query("UPDATE users SET " + avatarColumn + " = NULL, avatar_cloudinary_public_id = NULL, avatar_cloudinary_resource_type = NULL, avatar_original_file_name = NULL, avatar_mime_type = NULL, avatar_file_size = NULL, avatar_storage_provider = NULL WHERE id = ?", [req.user.id]);
    if (users[0].avatar_cloudinary_public_id) {
      try { await deleteObject(users[0].avatar_cloudinary_public_id, users[0].avatar_cloudinary_resource_type); } catch (error) { console.error('Avatar cleanup failed:', error.message); }
    }
    return res.json({ success: true, message: 'Avatar removed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/id-proof', authenticateToken, authorizeRoles('landowner'), upload.single('file'), async (req, res) => {
  let uploadedAsset;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'An identity document is required.' });
    validateUpload(req.file);
    const profiles = await query('SELECT id, id_proof_cloudinary_public_id, id_proof_cloudinary_resource_type FROM landowner_profiles WHERE user_id = ?', [req.user.id]);
    if (!profiles.length) return res.status(404).json({ success: false, message: 'Landowner profile not found.' });
    uploadedAsset = await uploadBuffer({
      publicId: makePublicId({ scope: 'id-proof', ownerId: req.user.id, recordId: profiles[0].id, originalName: req.file.originalname }),
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
      originalName: req.file.originalname
    });
    await query('UPDATE landowner_profiles SET id_proof_url = ?, id_proof_cloudinary_public_id = ?, id_proof_cloudinary_resource_type = ?, id_proof_original_file_name = ?, id_proof_mime_type = ?, id_proof_file_size = ?, id_proof_storage_provider = ? WHERE user_id = ?', [uploadedAsset.url, uploadedAsset.publicId, uploadedAsset.resourceType, req.file.originalname, req.file.mimetype, req.file.size, 'cloudinary', req.user.id]);
    if (profiles[0].id_proof_cloudinary_public_id) {
      try { await deleteObject(profiles[0].id_proof_cloudinary_public_id, profiles[0].id_proof_cloudinary_resource_type); } catch (error) { console.error('Previous ID proof cleanup failed:', error.message); }
    }
    return res.json({ success: true, data: { id_proof_img: uploadedAsset.url, id_proof_cloudinary_public_id: uploadedAsset.publicId } });
  } catch (error) {
    if (uploadedAsset) {
      try { await deleteObject(uploadedAsset.publicId, uploadedAsset.resourceType); } catch {}
    }
    return res.status(error.code === 'INVALID_FILE_TYPE' || error.code === 'FILE_TOO_LARGE' ? 400 : error.code === 'STORAGE_NOT_CONFIGURED' ? 503 : 500).json({ success: false, message: error.message });
  }
});

router.delete('/id-proof', authenticateToken, authorizeRoles('landowner'), async (req, res) => {
  try {
    const profiles = await query('SELECT id_proof_cloudinary_public_id, id_proof_cloudinary_resource_type FROM landowner_profiles WHERE user_id = ?', [req.user.id]);
    if (!profiles.length) return res.status(404).json({ success: false, message: 'Landowner profile not found.' });
    await query('UPDATE landowner_profiles SET id_proof_url = NULL, id_proof_cloudinary_public_id = NULL, id_proof_cloudinary_resource_type = NULL, id_proof_original_file_name = NULL, id_proof_mime_type = NULL, id_proof_file_size = NULL, id_proof_storage_provider = NULL WHERE user_id = ?', [req.user.id]);
    if (profiles[0].id_proof_cloudinary_public_id) {
      try { await deleteObject(profiles[0].id_proof_cloudinary_public_id, profiles[0].id_proof_cloudinary_resource_type); } catch (error) { console.error('ID proof cleanup failed:', error.message); }
    }
    return res.json({ success: true, message: 'Identity document removed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
