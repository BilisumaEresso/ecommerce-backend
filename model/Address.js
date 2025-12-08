const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  // name of the receipent
  name: { type: String, minlength: 4, maxlength: 25 },
  phoneNumber: { type: String, required: true },
  street: { type: String },
  city: String,
  kebele:String,
  state: String,
  postalCode: String,
  isDefault: {type:Boolean,default:false},
});

const Address = mongoose.model("address", addressSchema);

module.exports = Address;
