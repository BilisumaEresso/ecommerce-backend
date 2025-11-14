const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  // name of the receipent
  name: { type: String, minlength: 4, maxlength: 25 },
  user: { type: mongoose.Types.ObjectId, ref: "user" },
  phoneNumber: { type: String, required: true },
  street: { type: String },
  city: String,
  state: String,
  postalCode: String,
  isDefault: Boolean,
});

const Address = mongoose.model("address", addressSchema);

module.exports = Address;
