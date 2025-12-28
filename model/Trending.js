const mongoose = require("mongoose");

const trendSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String },
    reason: { type: String },
    source: { type: String },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index → auto delete when expiresAt < now
trendSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Trending = mongoose.model("trending", trendSchema);

module.exports = Trending;
