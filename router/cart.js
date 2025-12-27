const express=require("express")
const { cartController } = require("../controller")
const isAuth = require("../middleware/isAuth")

const router=express.Router()

router.post("/",isAuth,cartController.addToCart)
router.delete("/product/:productId",isAuth,cartController.removeFromCart)
router.patch("/:productId",isAuth,cartController.updateCart)
router.get("/user",isAuth,cartController.userCart)
router.delete("",isAuth,cartController.clearCart)
module.exports=router