// models/aiRecommendation.model.js
const mongoose = require("mongoose");

const aiRecommendationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    strategy: {
      type: String,
      default:"cart_based",
      required: true,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },

    // Only store product references
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        score: {
          type: Number, // relevance score from AI
          default: 0,
        },
        reason: {
          type: String, // optional explanation
        },
      },
    ],

    // What triggered this recommendation
    trigger: {
      type: String,
      enum: ["manual", "homepage", "search", "cart", "profile"],
      default: "manual",
    },

    expiresAt: {
      type: Date, // for cache invalidation
    },
  },
  { timestamps: true }
);

const Recommendation=mongoose.model("AIRecommendation", aiRecommendationSchema);

module.exports = Recommendation
