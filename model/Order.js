const { default: mongoose } = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Types.ObjectId, ref: "user", required:true },
    phoneNumber :{type: String},
    items: [
      {
        product: { type: mongoose.Types.ObjectId, ref: "product" },
        quantity: { type: Number, min: 1, default: 1 },
        price :{type:Number,required:true},
        totalItemPrice:{type:Number,required:true}
      },
    ],
    address: { type: mongoose.Types.ObjectId, ref: "address" },
    cart: { type: mongoose.Types.ObjectId, ref: "cart" },
    status: { type: String,enum:["pending","completed","shipped","delivered","cancelled"],default:"pending" },
    totalAmount:{type:Number,default:1,min:1}
  },
  { timestamps: true }
);

const Order = mongoose.model("order", orderSchema);

module.exports = Order;
