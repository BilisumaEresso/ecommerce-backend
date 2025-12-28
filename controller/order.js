const { User, Order, Cart, Product, Payment, Address } = require("../model");
const generateTransactionId = require("../utils/generateTransactionID");

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
      .populate("user","name email")
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

    // extract address if sent
    const bodyAddress = req.body?.address || null;
    let phoneNumber = req.body?.phoneNumber || null;

    // load cart
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) {
      res.status(404);
      throw new Error("cart not found");
    }
    if (!cart.items || cart.items.length === 0) {
      res.status(400);
      throw new Error("cart is empty");
    }

    // STEP 1: Validate stock + calculate total
    let totalAmount = 0;
    for (const item of cart.items) {
      const product = item.product;
      if (!product) {
        throw new Error("invalid product in cart");
      }

      const quantity = Number(item.quantity) || 1;
      if (product.quantity < quantity) {
        throw new Error(`not enough stock for product: ${product.name}`);
      }

      const price = Number(product.price);
      totalAmount += price * quantity;

      // record price on item to use later
      item._calculatedPrice = price;
    }

    // STEP 2: Resolve shipping address
    let addressId = null;

    if (!bodyAddress || Object.keys(bodyAddress).length === 0) {
      // no address provided, use default
      const user = await User.findById(userId);
      if (!user.address) {
        throw new Error("no default address found, please provide address");
      }
      addressId = user.address;
    } else {
      // address provided: create new address entry
      var newAddress = new Address(bodyAddress);
      if (bodyAddress.phoneNumber && !phoneNumber) {
        phoneNumber = bodyAddress.phoneNumber;
      }
      await newAddress.save();
      addressId = newAddress._id;
    }

    // STEP 3: Build order items list
    const orderItems = cart.items.map((item) => {
      const quantity = Number(item.quantity) || 1;
      const price = item._calculatedPrice;

      return {
        product: item.product._id,
        quantity,
        price,
        totalItemPrice: price * quantity,
      };
    });

    // STEP 4: Create order
    const order = await Order.create({
      user: userId,
      phoneNumber: phoneNumber || undefined,
      items: orderItems,
      totalAmount,
      address: addressId,
      cart: cart._id,
      status: "pending",
      paymentStatus: "unpaid",
    });

    // STEP 5: Deduct stock AFTER order created
    for (const item of cart.items) {
      const product = item.product;
      const quantity = Number(item.quantity);

      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { quantity: -quantity },
      sold:+quantity },
        { new: true }
      );
    }

    // STEP 6: Empty cart
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
     
    const address=await Address.findById(addressId)

    res.status(201).json({
      code: 201,
      status: true,
      message: "order placed successfully",
      order,
      address
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
      next(error)
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

const payNow=async(req,res,next)=>{
  try{
    const {id}=req.body
    if(!id){
      res.code=400
      throw new Error("order is required")
    }
    const order= await Order.findById(id).populate("user").populate("items.product")
    if(!order){
      res.code=404
      throw new Error("order not found")
    }

     do {
      var code=await generateTransactionId(16)
      var exists=await Payment.findOne({transactionId:code})
     }while(exists)
      const transactionId= code 
     const status="Completed"
     const paymentMethod="Online"
      const amount=await Number(order.totalAmount)
       const payment=new Payment()
       payment.order=order._id,
        payment.transactionId=transactionId,
        payment.paymentMethod=paymentMethod,
        payment.amount=amount,
        payment.status=status
      await payment.save()
      order.status="completed"
      order.save()
      res.status(201).json({
        code:201,
        status:true,
        message:"payment successfully completed",
        payment
      })
  }catch(error){
    next (error)
  }
}

const paymentInfo=async(req,res,next)=>{
  try{
    const {id}=req.params
    const payment= await Payment.findById(id).populate("order").populate("order.items.product")
    if(!payment){
      res.code=404
      throw new Error("payment info not found")
    }
    res.status(200).json({
      code:200,
      status:true,
      message:"payment info fetched successfully",
      payment
    })
  }catch(error){
    next(error)
  }
}

module.exports = { getAllOrders, addOrder ,getOrder,updateStatus,cancelOrder,payNow,paymentInfo};
