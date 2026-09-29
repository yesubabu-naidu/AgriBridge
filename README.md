# AgriBridge

AgriBridge is a React/Vite frontend backed by a Node.js/Express API and MySQL. Images are uploaded by Express to Cloudinary; MySQL remains the application database and stores the Cloudinary URL, public ID, resource type, and file metadata.

## Architecture

React sends multipart requests to Express. Express authenticates the request, validates the file, uploads the in-memory buffer to Cloudinary, and writes the resulting `secure_url` and `public_id` to MySQL. React never receives or bundles the Cloudinary API secret.

Cloudinary-backed resources include:

- User avatars: `PUT /api/profile/avatar`
- Land images: `POST /api/lands`, replacement through `PUT /api/lands/:id`
- Crop/product images: `POST /api/farmer/products`, replacement through `PUT /api/farmer/products/:id`
- Landowner identity documents: `PUT /api/profile/id-proof`

Deletion endpoints remove the MySQL reference and attempt to delete the Cloudinary asset. Existing external HTTPS URLs remain compatible.

## Cloudinary setup

1. Create or use a Cloudinary product environment.
2. From the Cloudinary Console, copy the cloud name and API key into the backend environment.
3. Store the API secret only in the Node.js hosting platform or local backend `.env`.
4. No Cloudinary credentials are required in React and no `VITE_CLOUDINARY_*` variables should be created.
5. The API uses generated public IDs under `agribridge/` and does not trust uploaded filenames as paths.

## Environment variables

Copy `.env.example` to the backend environment and set:

```text
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
MAX_FILE_SIZE_BYTES=10485760
ALLOWED_UPLOAD_MIME_TYPES=image/jpeg,image/png,image/webp,image/gif,application/pdf
```

Keep the Cloudinary secret backend-only. `.env` and `backend/.env` are ignored by Git; only placeholders belong in `.env.example`.

## MySQL migration

The checked-in seed data contains HTTPS Unsplash URLs, not Base64/data URLs. The live database must be checked in the deployment environment before migration:

```bash
cd backend
npm run inspect:file-data
```

This command is read-only and classifies values in the existing users avatar column (users.avatar or users.avatar_url), land_images.image_url, and products.image_url as empty, Base64 data URL, HTTP URL, local path, or other.

After reviewing the report, run the Cloudinary metadata migration once:

```bash
mysql -h "$DB_HOST" -u "$DB_USER" -p "$DB_NAME" \
  < database/migrations/001_add_cloudinary_metadata.sql
```

It adds Cloudinary public IDs/resource types and metadata while retaining the existing URL columns. The migration uses MySQL 8.0 `ADD COLUMN` clauses.

## Existing Base64/local-file migration

After the schema migration and Cloudinary environment variables are configured:

```bash
cd backend
npm run migrate:files
```

The script:

- Reads legacy Base64 data URLs and supported local paths.
- Leaves existing external HTTP(S) URLs unchanged.
- Uploads to deterministic Cloudinary public IDs.
- Updates MySQL only after Cloudinary succeeds.
- Deletes an uploaded Cloudinary asset if the MySQL update fails.
- Skips rows that already have a Cloudinary public ID.
- Prints scanned, migrated, skipped, and failed counts.

It never deletes local files. Verify Cloudinary assets and MySQL rows before removing any old local files.

## Local development

```bash
npm install
cd backend && npm install
cp ../.env.example .env
# edit backend/.env with MySQL, JWT, and Cloudinary values

# terminal 1
cd backend && npm run dev

# terminal 2
npm run dev
```

The frontend defaults to `http://localhost:5000/api`. Uploads accept JPEG, PNG, WebP, GIF, and PDF files up to 10 MB. Validation is repeated on the backend.

## Verification

```bash
cd backend
node --check server.js
node --check routes/cloudLands.js
node --check routes/cloudProducts.js
node --check routes/profile.js
node --check services/storageService.js
npm run inspect:file-data

cd ..
npm run build
```

With valid MySQL and Cloudinary credentials, verify:

1. Land, crop, avatar, and identity-document uploads.
2. Cloudinary receives each file and returns a `secure_url`/`public_id`.
3. MySQL stores the URL, public ID, resource type, MIME type, size, and original filename.
4. React displays the returned URL.
5. Replacements remove the previous Cloudinary asset.
6. Deletions remove the database reference and Cloudinary asset.
7. Invalid MIME types and oversized files receive 400 responses.
8. Cross-user mutation attempts are rejected by JWT role/ownership checks.
9. The built React bundle contains no Cloudinary API secret.

## Production deployment

1. Run `npm run inspect:file-data` with production MySQL credentials.
2. Run `database/migrations/001_add_cloudinary_metadata.sql`.
3. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` only on the Node host.
4. Configure remote MySQL variables and `FRONTEND_URL`.
5. Deploy the backend with `npm start` from `backend`.
6. Build React with the production `VITE_API_BASE_URL` and deploy it separately.
7. Run `npm run migrate:files` if the inspection report found Base64/local values.
8. Monitor Cloudinary and backend logs before retiring legacy data.

## Security

- Cloudinary API secrets are never sent to React.
- New images are uploaded as binary multipart data, never Base64 in MySQL.
- MIME type and size are validated by Multer and the storage service.
- Generated public IDs do not contain unsafe filenames.
- JWT roles and record ownership protect upload, replacement, and deletion operations.
- Cloudinary URLs are stored only after successful uploads.
