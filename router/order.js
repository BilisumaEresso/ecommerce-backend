const express=require("express")
const isAuth=require("../middleware/isAuth")
const { orderController, productController } = require("../controller")
const isAdmin = require("../middleware/isAdmin")

const router=express.Router()

router.post("/",isAuth,orderController.addOrder)
router.get("/",isAuth,orderController.getAllOrders)
router.get("/:id",isAuth,orderController.getOrder)
router.patch("/status/:id",isAuth,isAdmin,orderController.updateStatus)
router.patch("/cancel/:id",isAuth,orderController.cancelOrder)

// payment routes
router.post("/payment",isAuth,orderController.payNow)
router.get("/paymentInfo/:id",isAuth,orderController.paymentInfo)


module.exports=router