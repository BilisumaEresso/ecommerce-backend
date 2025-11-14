const express=require("express")
const { categoryController } = require("../controller")
const isAdmin = require("../middleware/isAdmin")
const isAuth = require("../middleware/isAuth")
const router=express.Router()

router.post("/add",isAuth,isAdmin,categoryController.addCategory)
router.get("/",isAuth,isAdmin,categoryController.categoryList)

module.exports=router