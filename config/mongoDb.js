const {connectionUrl}=require("./keys")
const   mongoose=require("mongoose")


const connectMongoDb=async()=>{
    try{
        await mongoose.connect(connectionUrl)
        console.log("database connected successfully")
    }catch(error){
        console.error(error)
    }
}

module.exports=connectMongoDb