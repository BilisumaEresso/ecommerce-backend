const notFound=(req,res,next)=>{
    res.code=404
    throw new Error("api not found")
}

module.exports=notFound