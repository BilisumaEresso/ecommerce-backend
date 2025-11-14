const {User}  = require("../model")

const isAdmin=async(req,res,next)=>{
    const {id}=req.user
    const user=await User.findById(id)
    if(user.role===1){
        res.code=403
        throw new Error("unauthorized")
    }
    next()
}

module.exports=isAdmin