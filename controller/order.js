const { User, Order, Cart, Product } = require("../model");

const getAllOrders = async (req, res, next) => {
  try {
    const userId = req.user && (req.user._id || req.user.id);
    if (!userId) {
      res.status(401);
      throw new Error("unauthenticated");
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error("user not found");
    }

    const orders = await Order.find({ user: userId })
      .populate("items.product")
      .populate("address");

    res.status(200).json({
      code: 200,
      status: true,
      message: "orders fetched successfully",
      orders,
    });
  } catch (error) {
    next(error);
  }
};

const addOrder = async (req, res, next) => {
  try {
    const userId = req.user && (req.user._id || req.user.id);
    if (!userId) {
      res.status(401);
      throw new Error("unauthenticated");
    }

    // optionally accept address or phoneNumber from body
    const { address, phoneNumber } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) {
      res.status(404);
      throw new Error("cart not found");
    }
    if (!cart.items || cart.items.length === 0) {
      res.status(400);
      throw new Error("cart is empty");
    }
    let totalAmount = 0;
    // build order items from cart
    const orderItems = await Promise.all(
      cart.items.map(async (item) => {
        const price =
          Number(item.price) || (item.product && Number(item.product.price)) || 0;
        const quantity = Number(item.quantity) || 1;
        totalAmount += price * quantity;

        // product may already be populated on the cart item, otherwise load it
        let productDoc =
          item.product && item.product._id
            ? item.product
            : await Product.findById(item.product);

        if (productDoc) {
          productDoc.quantity = Number(productDoc.quantity || 0) - quantity;
          if (productDoc.quantity<1){
            throw new Error("no enough products")
          }
          // if this is a mongoose document, save the change
          if (typeof productDoc.save === "function") {
            await productDoc.save();
          } else {
            // fallback: if we loaded via id, ensure update persisted
            await Product.findByIdAndUpdate(productDoc._id || item.product, {
              $set: { quantity: productDoc.quantity },
            }).exec();
          }
        }

        return {
          product:
            item.product && item.product._id ? item.product._id : item.product,
          quantity,
          price,
          totalItemPrice: price * quantity,
        };
      })
    );

    const order = await Order.create({
      user: userId,
      phoneNumber: phoneNumber || undefined,
      items: orderItems,
      address: address || undefined,
      cart: cart._id,
      totalAmount
    });

    // clear cart
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(201).json({
      code: 201,
      status: true,
      message: "order placed successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

const getOrder=async(req,res,next)=>{
    try{
        const {id}=req.params
        const user=req.user._id
        const order=await Order.findById(id).populate("items.product").populate("address")
        if(String(order.user)===String(user)){
            res.code=403
            throw new Error("not permitted")
        }
        res.status(200).json({
            code:200,
            status:true,
            message:"order fetched successfully",
            order
        })
    }catch(error){

    }
}

const updateStatus=async(req,res,next)=>{
    try{
        const {id}=req.params
        const {status}=req.body
        const order= await Order.findById(id).populate("items.product")
        if(!order){
            res.code=404
            throw new Error("order not found")
        }
        
        order.status=status
        
        await order.save();
        res.status(200).json({
            code:200,
            status:true,
            message:"status updated successfully",
            order
        })

    }catch(error){
        next(error)
    }
}

const cancelOrder=async(req,res,next)=>{
    try{
        const {id}=req.params
        const order=await Order.findById(id)
        if(!order){
            throw new Error( "order not found")
        }
        if((order.status!="pending")&&(order.status!="confirmed")){
            throw new Error("order cannot be cancelled on this phase, you are too late")
        }
        order.status="cancelled"
        await order.save()
        res.status(200).json({
            code:200,
            status:true,
            message:"order cancelled successfully",
            order
        })
    }catch(error){
        next(error)
    }
}

module.exports = { getAllOrders, addOrder ,getOrder,updateStatus,cancelOrder};
