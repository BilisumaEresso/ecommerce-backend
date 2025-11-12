const mongoose  = require("mongoose");

const productSchema=new mongoose.Schema({
    name:{type:String,required:true},
    desc:{type:String},
    quantity:{type:Number,default:1},
    price:{type:String,required:true},
    review:{type:mongoose.Types.ObjectId ,ref:"review"},
    category:{type:mongoose.Types.ObjectId,ref:"category",default:"None"},
    photo:[{type:mongoose.Types.ObjectId,ref:"file"}]
},{timestamps:true})

const Product= mongoose.model(productSchema,"product")

module.exports=Product