import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { deleteObject, getStoredAssetUrl, makePublicId, uploadBuffer, validateUpload } from '../services/storageService.js';
import { LAND_SELECT, normalizeLandInput } from '../services/landSchema.js';

const router = express.Router();
const ownerName = "COALESCE(NULLIF(u.name, ''), u.full_name)";

function fail(res, error) {
  console.error('Land database request failed:', error.message);
  return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : 'Database query failed', ...(process.env.NODE_ENV !== 'production' && !error.status ? { error: error.message } : {}) });
}

async function attachImages(land) {
  const rows = await query('SELECT id, image_url, cloudinary_public_id, cloudinary_resource_type, original_file_name, mime_type, file_size, is_primary FROM land_images WHERE land_id = ? ORDER BY is_primary DESC, id ASC', [land.id]);
  const urls = [land.image_url, ...rows.map((image) => getStoredAssetUrl(image.image_url, image.cloudinary_public_id, image.cloudinary_resource_type))].filter(Boolean);
  return { ...land, images: [...new Set(urls)], image_metadata: rows };
}

async function findOwnedLand(id, user) {
  const rows = await query('SELECT * FROM lands WHERE id = ? AND (landowner_id = ? OR ? = 1)', [id, user.id, user.role === 'admin' ? 1 : 0]);
  return rows[0] || null;
}

async function cleanupAssets(assets) {
  for (const asset of assets.filter((item) => item?.cloudinary_public_id || item?.publicId)) {
    const publicId = asset.cloudinary_public_id || asset.publicId;
    try { await deleteObject(publicId, asset.cloudinary_resource_type || asset.resourceType || 'image'); }
    catch (error) { console.error(`Cloudinary cleanup failed for ${publicId}:`, error.message); }
  }
}

router.get('/', async (req, res) => {
  try {
    const { location, land_type, min_acres, max_price, search } = req.query;
    let sql = `SELECT ${LAND_SELECT}, ${ownerName} AS owner_name, u.phone AS owner_phone FROM lands l JOIN users u ON l.landowner_id = u.id WHERE LOWER(TRIM(l.status)) IN ('active', 'approved')`;
    const params = [];
    if (location) { sql += ' AND l.location LIKE ?'; params.push(`%${location}%`); }
    if (land_type) { sql += ' AND l.land_type LIKE ?'; params.push(`%${land_type}%`); }
    if (min_acres) { sql += ' AND l.area_acres >= ?'; params.push(Number(min_acres)); }
    if (max_price) { sql += ' AND l.price_per_year <= ?'; params.push(Number(max_price)); }
    if (search) { sql += ' AND (l.location LIKE ? OR l.land_type LIKE ? OR l.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    sql += ' ORDER BY l.created_at DESC';
    const lands = await query(sql, params);
    return res.json({ success: true, data: await Promise.all(lands.map(attachImages)) });
  } catch (error) { return fail(res, error); }
});

router.get('/mine', authenticateToken, authorizeRoles('landowner'), async (req, res) => {
  try {
    const lands = await query(`SELECT ${LAND_SELECT}, ${ownerName} AS owner_name, u.email AS owner_email, u.phone AS owner_phone FROM lands l JOIN users u ON l.landowner_id = u.id WHERE l.landowner_id = ? ORDER BY l.created_at DESC`, [req.user.id]);
    return res.json({ success: true, data: await Promise.all(lands.map(attachImages)) });
  } catch (error) { return fail(res, error); }
});

router.get('/owner/:ownerId', authenticateToken, async (req, res) => {
  const ownerId = Number(req.params.ownerId);
  if (!Number.isInteger(ownerId) || ownerId <= 0) return res.status(400).json({ success: false, message: 'Invalid landowner id.' });
  if (req.user.id !== ownerId && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'You may only view your own land listings.' });
  try {
    const lands = await query(`SELECT ${LAND_SELECT} FROM lands l WHERE l.landowner_id = ? ORDER BY l.created_at DESC`, [ownerId]);
    return res.json({ success: true, data: await Promise.all(lands.map(attachImages)) });
  } catch (error) { return fail(res, error); }
});

router.get('/:id', async (req, res) => {
  try {
    const rows = await query(`SELECT ${LAND_SELECT}, ${ownerName} AS owner_name, u.email AS owner_email, u.phone AS owner_phone FROM lands l JOIN users u ON l.landowner_id = u.id WHERE l.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Land listing not found' });
    return res.json({ success: true, data: await attachImages(rows[0]) });
  } catch (error) { return fail(res, error); }
});

router.post('/', authenticateToken, authorizeRoles('landowner', 'admin'), upload.single('file'), async (req, res) => {
  let uploadedAsset;
  try {
    const input = normalizeLandInput(req.body);
    const imageUrl = String(req.body.image_url || '').trim();
    if (imageUrl && !/^https:\/\//i.test(imageUrl)) return res.status(400).json({ success: false, message: 'Use a file upload or a valid HTTPS image URL.' });
   const result = await query(
  `INSERT INTO lands
   (landowner_id, land_type, location, district, state, area_acres, soil_type, water_source, price_per_year)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    req.user.id,
    input.land_type,
    input.location,
    req.body.district || '',
    req.body.state || '',
    input.area_acres,
    req.body.soil_type || '',
    req.body.water_source || '',
    input.price_per_year
  ]
);
    const landId = result.insertId;
    if (req.file) {
      validateUpload(req.file);
      uploadedAsset = await uploadBuffer({ publicId: makePublicId({ scope: 'lands', ownerId: req.user.id, recordId: landId, originalName: req.file.originalname }), buffer: req.file.buffer, contentType: req.file.mimetype, originalName: req.file.originalname });
      await query('UPDATE lands SET image_url = ? WHERE id = ?', [uploadedAsset.url, landId]);
      await query('INSERT INTO land_images (land_id, image_url, cloudinary_public_id, cloudinary_resource_type, original_file_name, mime_type, file_size, storage_provider, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)', [landId, uploadedAsset.url, uploadedAsset.publicId, uploadedAsset.resourceType, req.file.originalname, req.file.mimetype, req.file.size, 'cloudinary']);
    } else if (imageUrl) await query('INSERT INTO land_images (land_id, image_url, storage_provider, is_primary) VALUES (?, ?, ?, TRUE)', [landId, imageUrl, 'external']);
    return res.status(201).json({ success: true, message: 'Land published successfully', data: { id: landId } });
  } catch (error) { if (uploadedAsset) await cleanupAssets([uploadedAsset]); return fail(res, error); }
});

router.put('/:id', authenticateToken, authorizeRoles('landowner', 'admin'), upload.single('file'), async (req, res) => {
  let uploadedAsset;
  try {
    const land = await findOwnedLand(req.params.id, req.user);
    if (!land) return res.status(404).json({ success: false, message: 'Land listing not found for your account.' });
    const input = normalizeLandInput({ land_type: req.body.land_type ?? req.body.land_name ?? land.land_type, location: req.body.location ?? land.location, area_acres: req.body.area_acres ?? req.body.acres ?? land.area_acres, price_per_year: req.body.price_per_year ?? req.body.lease_price ?? req.body.price_per_acre ?? land.price_per_year, description: req.body.description ?? land.description });
    await query('UPDATE lands SET location = ?, land_type = ?, area_acres = ?, price_per_year = ?, description = ? WHERE id = ?', [input.location, input.land_type, input.area_acres, input.price_per_year, input.description || null, land.id]);
    if (req.file) {
      validateUpload(req.file);
      const existing = await query('SELECT id, cloudinary_public_id, cloudinary_resource_type FROM land_images WHERE land_id = ? AND is_primary = TRUE ORDER BY id LIMIT 1', [land.id]);
      uploadedAsset = await uploadBuffer({ publicId: makePublicId({ scope: 'lands', ownerId: land.landowner_id, recordId: land.id, originalName: req.file.originalname }), buffer: req.file.buffer, contentType: req.file.mimetype, originalName: req.file.originalname });
      await query('UPDATE lands SET image_url = ? WHERE id = ?', [uploadedAsset.url, land.id]);
      if (existing.length) {
        await query('UPDATE land_images SET image_url = ?, cloudinary_public_id = ?, cloudinary_resource_type = ?, original_file_name = ?, mime_type = ?, file_size = ?, storage_provider = ? WHERE id = ?', [uploadedAsset.url, uploadedAsset.publicId, uploadedAsset.resourceType, req.file.originalname, req.file.mimetype, req.file.size, 'cloudinary', existing[0].id]);
        await cleanupAssets(existing);
      } else await query('INSERT INTO land_images (land_id, image_url, cloudinary_public_id, cloudinary_resource_type, original_file_name, mime_type, file_size, storage_provider, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)', [land.id, uploadedAsset.url, uploadedAsset.publicId, uploadedAsset.resourceType, req.file.originalname, req.file.mimetype, req.file.size, 'cloudinary']);
    }
    return res.json({ success: true, message: 'Land listing updated successfully' });
  } catch (error) { if (uploadedAsset) await cleanupAssets([uploadedAsset]); return fail(res, error); }
});

router.delete('/:id', authenticateToken, authorizeRoles('landowner', 'admin'), async (req, res) => {
  try {
    const land = await findOwnedLand(req.params.id, req.user);
    if (!land) return res.status(404).json({ success: false, message: 'Land listing not found for your account.' });
    const images = await query('SELECT cloudinary_public_id, cloudinary_resource_type FROM land_images WHERE land_id = ? AND cloudinary_public_id IS NOT NULL', [land.id]);
    await query('DELETE FROM lands WHERE id = ?', [land.id]);
    await cleanupAssets(images);
    return res.json({ success: true, message: 'Land listing deleted successfully' });
  } catch (error) { return fail(res, error); }
});

export default router;
