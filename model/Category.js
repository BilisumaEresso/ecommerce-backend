const mongoose = require("mongoose");

const categorySchema=new mongoose.Schema({
    name:{type:String,required:true},
    desc:{type:String},
    createdBy:{type:mongoose.Types.ObjectId,ref:"user"},
    // slug is for user friendly routing like "laptops"
    slug:{type:String}
    
},{timestamps:true})

const Category= mongoose.model(categorySchema,"category")

module.exports=Category