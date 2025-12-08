const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address:{type:mongoose.Types.ObjectId, ref:"address",required:true},
    // 1-user 2-admin 3-super-admin
    role: { type: Number, default: 1 },
    password: { type: String, required: true, minlength: 6 },
  },
  { timestamps: true }
);

const User = mongoose.model("user", userSchema);
module.exports = User;
