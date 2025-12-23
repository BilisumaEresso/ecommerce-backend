const {User, Address}=require("../model")
const comparePassword = require("../utils/comparePassword")
const generateToken = require("../utils/generateToken")
const hashPassword = require("../utils/hashPassword")

const signup=async(req,res,next)=>{
    try{
        const {name,email,password,phoneNumber,street,city,state,kebele,postalCode}=req.body
        const emailExist= await User.findOne({email})
        if(emailExist){
            res.status(400)
            throw new Error ("email already exists")
        }
        const address = new Address({name,phoneNumber,street,postalCode,kebele,city,state,isDefault:true})
        await address.save()
        const user = new User()
        const hashed=await hashPassword(password)
        user.name=name
        user.email=email
        user.password=hashed
        user.address=address._id
        const savedUser = await user.save()
        await savedUser.populate("address")
        const token=await generateToken(savedUser)
        res.status(201).json({
            code:201,
            status:true,
            message:"user signed up successfully!!",
            token:token,
            user: savedUser
        })
    }catch(error){
        next(error)
    }
}

const login=async(req,res,next)=>{
    try{
        const {email,password}=req.body
        var user=await User.findOne({email})
        if(!user){
            res.code=404
            throw new Error("email does not exist")
        }
       const isMatch=await comparePassword(password,user.password)
       if(!isMatch){
        res.code=400
        throw new Error("incorrect password")
       }
       token= await generateToken(user)
       res.status(200).json({
         code: 200,
         status: true,
         message: "user logged in successfully",
         token: token,
         user: {
           id: user._id,
           name: user.name,
           email: user.email,
           role: user.role, // 1 buyer | 2 seller | 3 superAdmin
         },
       });
    }catch(error){
        next(error)
    }
}

const updateProfile=async(req,res,next)=>{
    try{
        const {id}=req.user
        const {name,email}=req.body
        if(!name&&!email){
            res.code=400
            throw new Error("empty input")
        }
        const user=await User.findById(id)
        if(!user){
            res.code=400
            throw new Error("user not found")
        }
        user.name=name?name:user.name
        user.email=email?email:user.email
        await user.save()
        token=await generateToken(user)
        res.status(200).json({
            code:200,
            status:true,
            message:"user profile updated successfully",
            token :token
        })
    }catch(error){
        next(error)
    }
}

const changePassword=async(req,res,next)=>{
    try{
        const {oldPassword,newPassword}=req.body
        const {id}=req.user
        if (!oldPassword||!newPassword){
            res.code=400
            throw new Error("password is required")
        }
        const user= await User.findById(id)
        if(!user){
            res.code=404
            throw new Error("user not found")
        }
        const isMatch= await comparePassword(oldPassword,user.password)
        if(!isMatch){
            res.code=400
            throw new Error("incorrect password")
        }
        if(newPassword.length<5){
            res.code=400
            throw new Error("password is too short")
        }
        const hashedPassword=  await hashPassword(newPassword)
        user.password=hashedPassword
        await user.save()
        res.status(200).json({
            code:200,
            status:true,
            message:"password changed successfully"
        })
    }catch(error){
        next(error)
    }
}

const getUser = async (req, res, next) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id).populate("address");
    if (!user) {
      res.code = 404;
      throw new Error("user not found");
    }
     res.status(200).json({
       code: 200,
       status: true,
       message: "user info fetched successfully successfully",
       user
     });
  } catch (error) {
    next(error);
  }
};

module.exports={signup,login,updateProfile,changePassword,getUser}