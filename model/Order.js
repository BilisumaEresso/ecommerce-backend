const { default: mongoose } = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Types.ObjectId, ref: "user", required },
  product: [
    {
      productId: { type: mongoose.Types.ObjectId, ref: "product" },
      quantity: { type: Number, min: 1, default: 1 },
    },
  ],
  address: { type: mongoose.Types.ObjectId, ref: "address" },
  cart: { type: mongoose.Types.ObjectId, ref: "cart" },
  status: { type: String, enum: ["Delivered", "Pending", "Shipped"] },
  
},{timestamps:true});

const Order=mongoose.model(orderSchema,"order")

module.exports=Order