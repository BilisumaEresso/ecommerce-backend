const {User}=require("../model")
const comparePassword = require("../utils/comparePassword")
const generateToken = require("../utils/generateToken")
const hashPassword = require("../utils/hashPassword")

const signup=async(req,res,next)=>{
    try{
        const {name,email,password}=req.body
        const emailExist= await User.findOne({email})
        if(emailExist){
            res.code=400
            throw new Error ("email already exists")
        }
        const user= new User
        const hashed=await hashPassword(password)
        user.name=name
        user.email=email
        user.password=hashed
        res.status(201).json({
            code:201,
            status:true,
            message:"user signed up successfully!!",
        })
    }catch(error){
        next(error)
    }
}

const login=async(req,res,next)=>{
    try{
        const {email,password}=req.body
        const user=await User.findOne({email})
        if(!user){
            res.code=404
            throw new Error("email does not exist")
        }
       const isMatch=await comparePassword(password,user.password)
       if(!isMatch){
        res.code=400
        throw new Error("")
       }
    }catch(error){
        next(error)
    }
}

module.exports={signup,login}