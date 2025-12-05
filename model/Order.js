const { default: mongoose } = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "user", required:true },
    phoneNumber :{type: String},
    product: [
      {
        productId: { type: mongoose.Types.ObjectId, ref: "product" },
        quantity: { type: Number, min: 1, default: 1 },
      },
    ],
    address: { type: mongoose.Types.ObjectId, ref: "address" },
    cart: { type: mongoose.Types.ObjectId, ref: "cart" },
    status: { type: String,default:"Pending" },
  },
  { timestamps: true }
);

const Order = mongoose.model("order", orderSchema);

module.exports = Order;
