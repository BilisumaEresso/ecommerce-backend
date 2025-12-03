# Multiple Image Upload with Cloudinary (Backend)

This note explains how to upload multiple images to Cloudinary using the backend product creation route and store results in MongoDB.

## Dependencies

- `multer` — to parse multipart/form-data and receive files from clients
- `cloudinary` — official Cloudinary SDK

Install them locally if not already installed:

```bash
npm install multer cloudinary
```

Also make sure you already have `express` and `mongoose` installed and configured.

## Setup environment variables

Add Cloudinary credentials to your `.env` file:

```env
# Option 1 (recommended)
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>

# Option 2 (individual envs)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

The app includes `config/cloudinary.js` which reads `CLOUDINARY_URL` or the three individual env vars above.

## Endpoint

- Route: `POST /api/v1/product`
- Headers: `Authorization: Bearer <token>` (must be an admin)
- Content-Type: `multipart/form-data`
- Form fields: `name`, `price`, `desc`, `category`, (others like `quantity`)
- Files: one or more files under the same key — `images` (example `images[]`) — Max: 6 files

The product route processes any files in `req.files`, uploads each to Cloudinary (folder `ecommerce/products`), creates `File` documents containing meta data and the `signedUrl` (secure Cloudinary URL), stores the file \_ids in the product `photo` field and also stores the Cloudinary `public_id` for each file.

## Response

When files are included, the API response contains the saved product (the `photo` field is populated with `File` objects), and an `uploadedFiles` array enumerating each file's metadata and its `_id`.

Example (abbreviated) response body:

```json
{
  "code": 200,
  "status": true,
  "message": "product added successfully",
  "product": {
    "_id": "<productId>",
    "name": "Test product",
    "photo": [
      {
        "_id": "<fileId>",
        "name": "photo1.jpg",
        "signedUrl": "https://res.cloudinary.com/.../photo1.jpg"
      }
    ]
  },
  "uploadedFiles": [
    {
      "_id": "<fileId>",
      "name": "photo1.jpg",
      "signedUrl": "https://res.cloudinary.com/.../photo1.jpg",
      "public_id": "ecommerce/products/photo1",
      "size": "12345",
      "type": "jpg"
    }
  ]
}
```

## Example curl

```bash
curl -X POST http://localhost:8000/api/v1/product \
  -H "Authorization: Bearer <token>" \
  -F "name=Test product" \
  -F "price=49.9" \
  -F "desc=Some short description" \
  -F "category=<categoryId>" \
  -F "images=@/path/to/photo1.jpg" \
  -F "images=@/path/to/photo2.png"
```

### Append images to an existing product

- Route: `POST /api/v1/product/:id/images`
- Headers: `Authorization: Bearer <token>` (must be an admin)
- Content-Type: `multipart/form-data`
- Form files: `images` (one or more)

Example curl:

```bash
curl -X POST http://localhost:8000/api/v1/product/<productId>/images \
  -H "Authorization: Bearer <token>" \
  -F "images=@/path/to/photo3.jpg" \
  -F "images=@/path/to/photo4.png"
```

## What to update/adjust

- Adjust `upload.array('images', 6)` in `router/product.js` if you want a different key or limit.
- The code uses in-memory storage and data-URI direct upload. If you prefer streaming or disk based approaches, adapt the `multer` storage settings.
- Consider adding validation (file types, size limits) using `fileFilter` and `limits` in `multer` config.
- Add a cleanup strategy: when deleting a product, remove associated Cloudinary resources and File documents.

## Security & best practices

- Limit number and size of files using `multer` to avoid memory issues (we use memory storage by default)
- Validate file MIME types and file extensions with `fileFilter`
- Consider using signed or preset-based uploads if clients should directly upload to Cloudinary
- Ensure only authorized users can upload/edit product images
