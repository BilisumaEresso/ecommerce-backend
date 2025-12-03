const mongoose = require("mongoose");

const fileSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    size: { type: String, required: true },
    type: { type: String, required: true, default: "png" },
    signedUrl: { type: String, required: true },
    // Cloudinary public id for resource management (deletion, transformations)
    public_id: { type: String, required: false },
  },
  { timestamps: true }
);

const File = mongoose.model("file", fileSchema);
module.exports = File;
