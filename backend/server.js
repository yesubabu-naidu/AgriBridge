import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import farmerRoutes from './routes/farmer.js';
import landownerRoutes from './routes/landowner.js';
import buyerRoutes from './routes/buyer.js';
import cloudLandRoutes from './routes/cloudLands.js';
import cloudProductRoutes from './routes/cloudProducts.js';
import adminRoutes from './routes/admin.js';
import irrigationRoutes from './routes/irrigation.js';
import aiRoutes from './routes/ai.js';
import { authenticateToken, authorizeRoles } from './middleware/auth.js';
import { guardFarmerData } from './middleware/farmerDataGuard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();
const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins = new Set(['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', process.env.FRONTEND_URL, ...(process.env.ADDITIONAL_CORS_ORIGINS || '').split(',').map((value) => value.trim())].filter(Boolean));

app.disable('x-powered-by');
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.has(origin)) return callback(null, true); return callback(new Error('Origin is not allowed by CORS policy.')); }, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'], maxAge: 86400 }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()'); next(); });

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/lands', cloudLandRoutes);
app.use('/api/farmer', cloudProductRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/landowner', landownerRoutes);
app.use('/api/buyer', cloudProductRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/irrigation', authenticateToken, authorizeRoles('farmer'), guardFarmerData, irrigationRoutes);
app.use('/api/ai', authenticateToken, authorizeRoles('farmer'), guardFarmerData, aiRoutes);
app.get('/api/health', (req, res) => res.json({ success: true, message: 'AgriBridge API is healthy.', timestamp: new Date().toISOString() }));
app.use((req, res) => res.status(404).json({ success: false, message: 'API route not found.' }));
app.use((error, req, res, next) => { console.error('Unhandled request error:', error.message); const fileError = error.code === 'LIMIT_FILE_SIZE' || error.code === 'INVALID_FILE_TYPE'; res.status(fileError ? 400 : 500).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'File is too large.' : error.code === 'INVALID_FILE_TYPE' ? error.message : 'Internal server error.' }); });
import { query } from './config/db.js';
import { syncExistingLeaseAmounts } from './services/leaseService.js';

app.listen(port, () => {
  console.log(`AgriBridge API listening on port ${port}`);
  syncExistingLeaseAmounts(query).catch(err => console.error('Initial lease sync check note:', err.message));
});
