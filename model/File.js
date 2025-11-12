const { default: mongoose } = require("mongoose");

const fileSchema=mongoose.Schema({
    name:{type:String,required:true},
    size:{type:String,required:true},
    type:{type:String,required:true,default:"png"},
    signedUrl:{type:String,required:true},


},{timestamp:true})

const File=mongoose.model(fileSchema,"file")
module.exports=File