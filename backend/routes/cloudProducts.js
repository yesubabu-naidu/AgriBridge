import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { deleteObject, getStoredAssetUrl, makePublicId, uploadBuffer, validateUpload } from '../services/storageService.js';

const router = express.Router();

async function resolveProduct(product) {
  return {
    ...product,
    image_url: getStoredAssetUrl(product.image_url, product.image_cloudinary_public_id, product.image_cloudinary_resource_type)
  };
}

async function cleanupAsset(asset) {
  if (!asset?.publicId) return;
  try { await deleteObject(asset.publicId, asset.resourceType || 'image'); } catch (error) { console.error(`Cloudinary cleanup failed for ${asset.publicId}:`, error.message); }
}

async function listProducts(req, res, ownerId = null) {
  const ownerClause = ownerId ? " AND p.farmer_id = ?" : "";
  const statusClause = ownerId ? "" : " AND LOWER(TRIM(p.status)) = " + String.fromCharCode(39) + "available" + String.fromCharCode(39) + " AND p.available_qty > 0";
  const params = ownerId ? [ownerId] : [];
  const products = await query(
    `SELECT p.*, p.available_qty AS quantity, COALESCE(NULLIF(u.name, ""), u.full_name) AS farmer_name, u.email AS farmer_email, u.phone AS farmer_phone
     FROM products p JOIN users u ON p.farmer_id = u.id
     WHERE 1 = 1${statusClause}${ownerClause} ORDER BY p.created_at DESC`,
    params
  );
  return res.json({ success: true, data: await Promise.all(products.map(resolveProduct)) });
}

router.get('/products', (req, res, next) => {
  const handler = (ownerId = null) => listProducts(req, res, ownerId).catch(next);
  if (req.baseUrl.endsWith('/farmer')) {
    return authenticateToken(req, res, () => authorizeRoles('farmer')(req, res, () => handler(req.user.id)));
  }
  return handler();
});

router.get('/my-products', authenticateToken, authorizeRoles('farmer'), async (req, res) => {
  try { return await listProducts(req, res, req.user.id); } catch (error) { return res.status(500).json({ success: false, message: error.message }); }
});

router.post('/products', authenticateToken, authorizeRoles('farmer'), upload.single('file'), async (req, res) => {
  let uploadedAsset;
  try {
    const { product_name, category, price_per_unit, unit, quantity, available_qty, location, image_url, description } = req.body;
    if (!product_name || !category || price_per_unit == null || (quantity == null && available_qty == null)) {
      return res.status(400).json({ success: false, message: 'Product name, category, price, and quantity are required.' });
    }
    if (image_url && !/^https?:\/\//i.test(image_url)) {
      return res.status(400).json({ success: false, message: 'Use a file upload or a valid HTTPS image URL.' });
    }
    const availableQty = Number(available_qty ?? quantity);
    const price = Number(price_per_unit);
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(availableQty) || availableQty < 0) {
      return res.status(400).json({ success: false, message: "Price must be positive and quantity cannot be negative." });
    }
    const listingStatus = availableQty === 0 ? "out_of_stock" : "available";
    const result = await query(
      `INSERT INTO products (farmer_id, product_name, category, price_per_unit, unit, available_qty, location, image_url, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
      [req.user.id, product_name, category, price, unit || "kg", availableQty, location || "", req.file ? null : (image_url || ""), description || ""]
    );
    const productId = result.insertId;
    await query("UPDATE products SET status = ? WHERE id = ? AND farmer_id = ?", [listingStatus, productId, req.user.id]);
    if (req.file) {
      validateUpload(req.file);
      uploadedAsset = await uploadBuffer({
        publicId: makePublicId({ scope: 'products', ownerId: req.user.id, recordId: productId, originalName: req.file.originalname }),
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        originalName: req.file.originalname
      });
      await query('UPDATE products SET image_url = ?, image_cloudinary_public_id = ?, image_cloudinary_resource_type = ?, image_original_file_name = ?, image_mime_type = ?, image_file_size = ?, image_storage_provider = ? WHERE id = ? AND farmer_id = ?', [uploadedAsset.url, uploadedAsset.publicId, uploadedAsset.resourceType, req.file.originalname, req.file.mimetype, req.file.size, 'cloudinary', productId, req.user.id]);
    }
    return res.status(201).json({ success: true, message: 'Produce listed successfully', data: { id: productId } });
  } catch (error) {
    if (uploadedAsset) await cleanupAsset(uploadedAsset);
    return res.status(error.code === 'INVALID_FILE_TYPE' || error.code === 'FILE_TOO_LARGE' ? 400 : error.code === 'STORAGE_NOT_CONFIGURED' ? 503 : 500).json({ success: false, message: error.message });
  }
});

router.put('/products/:id', authenticateToken, authorizeRoles('farmer'), upload.single('file'), async (req, res) => {
  let uploadedAsset;
  try {
    const products = await query('SELECT * FROM products WHERE id = ? AND farmer_id = ?', [req.params.id, req.user.id]);
    if (!products.length) return res.status(404).json({ success: false, message: 'Crop listing not found.' });
    const current = products[0];
    const { product_name, category, price_per_unit, unit, quantity, available_qty, location, description } = req.body;
    const availableQty = Number(available_qty ?? quantity);
    const price = Number(price_per_unit);
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(availableQty) || availableQty < 0) {
      return res.status(400).json({ success: false, message: "Price must be positive and quantity cannot be negative." });
    }
    const listingStatus = availableQty === 0 ? "out_of_stock" : "available";
    await query("UPDATE products SET product_name = ?, category = ?, price_per_unit = ?, unit = ?, available_qty = ?, location = ?, description = ?, status = ? WHERE id = ? AND farmer_id = ?", [product_name, category, price, unit || "kg", availableQty, location || "", description || "", listingStatus, req.params.id, req.user.id]);
    if (req.file) {
      validateUpload(req.file);
      uploadedAsset = await uploadBuffer({
        publicId: makePublicId({ scope: 'products', ownerId: req.user.id, recordId: req.params.id, originalName: req.file.originalname }),
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        originalName: req.file.originalname
      });
      await query('UPDATE products SET image_url = ?, image_cloudinary_public_id = ?, image_cloudinary_resource_type = ?, image_original_file_name = ?, image_mime_type = ?, image_file_size = ?, image_storage_provider = ? WHERE id = ? AND farmer_id = ?', [uploadedAsset.url, uploadedAsset.publicId, uploadedAsset.resourceType, req.file.originalname, req.file.mimetype, req.file.size, 'cloudinary', req.params.id, req.user.id]);
      await cleanupAsset({ publicId: current.image_cloudinary_public_id, resourceType: current.image_cloudinary_resource_type });
    }
    return res.json({ success: true, message: 'Crop listing updated successfully.' });
  } catch (error) {
    if (uploadedAsset) await cleanupAsset(uploadedAsset);
    return res.status(error.code === 'INVALID_FILE_TYPE' || error.code === 'FILE_TOO_LARGE' ? 400 : error.code === 'STORAGE_NOT_CONFIGURED' ? 503 : 500).json({ success: false, message: error.message });
  }
});

router.delete('/products/:id', authenticateToken, authorizeRoles('farmer'), async (req, res) => {
  try {
    const products = await query('SELECT image_cloudinary_public_id, image_cloudinary_resource_type FROM products WHERE id = ? AND farmer_id = ?', [req.params.id, req.user.id]);
    if (!products.length) return res.status(404).json({ success: false, message: 'Crop listing not found.' });
    await query('DELETE FROM products WHERE id = ? AND farmer_id = ?', [req.params.id, req.user.id]);
    await cleanupAsset({ publicId: products[0].image_cloudinary_public_id, resourceType: products[0].image_cloudinary_resource_type });
    return res.json({ success: true, message: 'Crop listing removed successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
