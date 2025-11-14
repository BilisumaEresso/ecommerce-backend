const { Category } = require("../model")
const slugify=require("slugify")

const addCategory=async(req,res,next)=>{
    try{
        const {name,desc}=req.body
        const {id}=req.user
        if(!name){
            res.code=400
            throw new Error("category name is required")
        }
        const nameExist=await Category.findOne({name})
        if(nameExist){
            res.code=400
            throw new Error("Category already exists")
         }
         const slug= await slugify(name,{lower:true})
         const category=await Category.create({
            name,
            desc,
            slug,
            createdBy:id

         })
        res.status(201).json({
            code:201,
            status:true,
            message:"category created successfully",
            category
        })
    }catch(error){
        next(error)
    }
}

const categoryList=async(req,res,next)=>{
    try{
        const {q}=req.query
        let filter={}
        if (q) {
          filter = {
            $or: [
              { name: { $regex: q, $options: "i" } },
              { desc: { $regex: q, $options: "i" } },
            ],
          };
        }

        const categories = await Category.find(filter).sort({
          name:1,
        });
        res.status(200).json({
            categories:categories
        })
    }catch(error){
        next(error)
    }
}

module.exports={addCategory,categoryList}