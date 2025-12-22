const express =require("express")
const isAuth = require("../middleware/isAuth")
const isAdmin =require("../middleware/isAdmin")
const { aiController } = require("../controller")
const isSuperAdmin = require("../middleware/isSuperAdmin")


const router=express.Router()

router.get("/recommend",isAuth,aiController.recommendProducts)
router.post("/trends",isAuth,isSuperAdmin,aiController.generateTrends)
router.get("/trends",aiController.getTrends)

module.exports=router