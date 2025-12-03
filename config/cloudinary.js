const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();

// If CLOUDINARY_URL is available it will be used automatically by cloudinary
// Otherwise expect separate env vars like CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ url: process.env.CLOUDINARY_URL });
} else if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

module.exports = cloudinary;
