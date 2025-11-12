const jwt =require("jsonwebtoken")
const { jwtKey } = require("../config/keys")

const generateToken=async(user)=>{
    return jwt.sign(user,jwtKey)
}

module.exports=generateToken