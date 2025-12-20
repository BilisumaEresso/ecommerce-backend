const express =require("express")
const isAuth = require("../middleware/isAuth")
const { aiController } = require("../controller")


const router=express.Router()

router.get("/",isAuth,aiController.getRecommendedProducts)

module.exports=router