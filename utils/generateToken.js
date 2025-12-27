const jwt = require("jsonwebtoken");
const { jwtKey } = require("../config/keys");

const generateToken = (user) => {
  return jwt.sign(
    { name:user.name,role:user.role, id: user._id, email: user.email,createdAt:user.createdAt },
    jwtKey,
    { expiresIn: "7d" }
  );
};

module.exports = generateToken;
