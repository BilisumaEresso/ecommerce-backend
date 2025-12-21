const mongoose=require("mongoose")

const trendSchema=new mongoose.Schema({
    name:{type:String,required:true},
    category:{type:String},
    reason:{type:String},
    source:{type:String},

},{timestamps:true})

const Trending= mongoose.model("trending",trendSchema)

module.exports= Trending