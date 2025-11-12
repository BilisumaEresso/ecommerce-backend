const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "user" },
    product: { type: mongoose.Types.ObjectId, ref: "product" },
    rating: { type: Number, min: 1, max:5, required: true },
    comment: { type: String },
  },
  { timestamps: true }
);

const Review = mongoose.model("review", reviewSchema);

module.exports = Review;
