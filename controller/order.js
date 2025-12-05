const { User, Order } = require("../model")

const getAllOrders=async(req,res,next)=>{
    try{
        const userId=req.user._id||req.user._id
        const user=await User.findById(userId)
        if(!user){
            res.code=404
            throw new Error("user not found")
        }
        const orders=await Order.find({user:user}).populate("product")
        if(order.length<0){
            res.code=404
            throw new Error("no orders yet")
        }
        res.status(200).json({
            code:200,
            status:true,
            message:"order fetched successfully",
            orders
        })
    }catch(error){
        next (error)
    }
}

const addOrder=async(req,res,next)=>{
    try{
        const userId=req.user._id
        const {id}=req.params
    }catch(error){
        next(error)
    }
}

module.exports={getAllOrders }