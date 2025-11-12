const { default: mongoose } = require("mongoose");

const paymentSchema= new mongoose.Schema({
    order:{type:mongoose.Types.ObjectId,ref:"order",required:true},
    transactionId:{type:String,required:true,unique:true},
    // status is either pending or completed or failed or refunded
    status:{type :String,default:"Pending",enum:["Pending","Failed","Completed","Refunded"]},
    paymentMethod:{type:String,default:"Cash"},
    amount:{type:Number,required,min:0.5},
    currency:{type:String,default:"ETB",},

},{timestamps:true})

const Payment= mongoose.model(paymentSchema,"payment")

module.exports=Payment