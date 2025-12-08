const { Category, Product, User } = require("../model")
const slugify=require("slugify")

const addCategory=async(req,res,next)=>{
    try{
        const {name,desc}=req.body
        const {id}=req.user
        const user =await User.findById(id)
        if(!user){
            res.code=404
            throw new Error("user not found")
        }
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

const getProducts=async(req,res,next)=>{
    try{
        const {id}=req.params
        const products=await Product.find({category:id})
        res.status(200).json({
            code:200,
            status:true,
            message:"products fetched successfully",
            products
        })
        
    }catch(error){
        next(error)
    }
}

const updateCategory=async(req,res,next)=>{
    try{
        const {id}=req.params
        const {name,desc}=req.body
        const category=await Category.findById(id)
        if(!category){
            res.code=404
            throw new Error("category not found")
        }
         const nameExist = await Category.findOne({ name });
         if (nameExist) {
           res.code = 400;
           throw new Error("Category already exists");
         }
         const slug = await slugify(name||category.name, { lower: true })||category.slug
          category.name=name?name:category.name
          category.desc=desc?desc:category.desc
          category.slug=slug?slug:category.slug
          await category.save()
         res.status(201).json({
           code: 201,
           status: true,
           message: "category updated successfully",
           category,
         });
    }catch(error){
        next(error)
    }
}

const getCategory=async(req,res,next)=>{
    try{
        const {id}=req.params
        const category=await Category.findById(id)
        if(!category){
            res.code=404
            throw new Error("Category not found")

        }
        res.status(200).json({
            code:200,
            status:true,
            message:"category detail fetched successfully",
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

const deleteCategory=async(req,res,next)=>{
    try{
        const {id}=req.params
        const category=await Category.findByIdAndDelete(id)
        if(!category){
            res.code=404
            throw new Error("category not found")
        }
        res.status(200).json({
            code:200,
            status:true,
            message:"category deleted successfully"

        })
    }catch(error){
        next(error)
    }
}

module.exports={addCategory,categoryList,getCategory,updateCategory,getProducts,deleteCategory}