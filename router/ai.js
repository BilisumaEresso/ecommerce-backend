const express =require("express")
const isAuth = require("../middleware/isAuth")
const isAdmin =require("../middleware/isAdmin")
const { aiController } = require("../controller")


const router=express.Router()

router.get("/recommend",isAuth,aiController.recommendProducts)
router.post("/trends",isAuth,isAdmin,aiController.generateTrends)
router.get("/trends",isAuth,isAdmin,aiController.getTrends)

module.exports=router