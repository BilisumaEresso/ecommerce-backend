const express=require("express")
const { categoryController } = require("../controller")
const isAdmin = require("../middleware/isAdmin")
const isAuth = require("../middleware/isAuth")
const router=express.Router()

router.post("/",isAuth,isAdmin,categoryController.addCategory)
router.get("/",categoryController.categoryList)
router.get("/:id",categoryController.getCategory)
router.put("/:id",isAuth,isAdmin,categoryController.updateCategory)
router.get("/:id/products", categoryController.getProducts);
router.delete("/:id",isAuth,isAdmin,categoryController.deleteCategory)

module.exports=router