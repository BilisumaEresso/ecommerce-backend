const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    desc: { type: String },
    quantity: { type: Number, default: 1 },
    price: { type: String, required: true },
    averageRating: {type: Number, default:0 },
    rateNumber:{type:Number,default:0},
    category: {
      type: mongoose.Types.ObjectId,
      ref: "category",
    },
    createdBy:{
      type:mongoose.Types.ObjectId,
      ref:"user"
    },
    photo: [{ type: mongoose.Types.ObjectId, ref: "file" }],
  },
  { timestamps: true }
);

const Product = mongoose.model("product", productSchema);

module.exports = Product;
