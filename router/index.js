const authRoute=require("./auth")
const categoryRoute=require("./category")
const productRouter=require("./product")
const orderRouter=require("./order")
const cartRouter=require("./cart")
const aiRouter=require("./ai")
const adminRouter=require("./admin")


module.exports = { authRoute, categoryRoute, productRouter,orderRouter,cartRouter,aiRouter,adminRouter };