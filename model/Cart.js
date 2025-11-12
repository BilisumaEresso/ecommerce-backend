const { default: mongoose } = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "user" },
    items: [
      {
        product: { type: mongoose.Types.ObjectId, ref: "product" },
        quantity: Number,
        price: Number,
      },
    ],
    totalPrice: Number,
  },
  { timestamps: true }
);

const Cart = mongoose.model("cart", cartSchema);

module.exports = Cart;
