const { Cart, Product } = require("../model");

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const user = req.user && (req.user._id || req.user.id);
    if (!user) {
      res.status(401);
      throw new Error("unauthenticated");
    }

    const productDetail = await Product.findById(productId);
    if (!productDetail) {
      res.status(404);
      throw new Error("product not found");
    }

    // ensure numeric values
    const qty = Number(quantity) > 0 ? Number(quantity) : 1;
    const price = Number(productDetail.price) || 0;

    const item = {
      product: productId,
      quantity: qty,
      price: price,
    };

    // find existing cart for the user (unique user per cart)
    let cart = await Cart.findOne({ user });
    if (cart) {
      // check if product already in cart
      const existingIndex = cart.items.findIndex(
        (i) => i.product.toString() === productId.toString()
      );
      if (existingIndex > -1) {
        // update quantity and item total price
        cart.items[existingIndex].quantity += qty;
      } else {
        cart.items.push(item);
      }

      // recompute totalPrice from items to avoid drift
      cart.totalPrice = cart.items.reduce(
        (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0),
        0
      );
      await cart.save();
      return res.status(200).json({
        code: 200,
        status: true,
        message: "added to cart successfully",
        cart,
      });
    } else {
      const newCart = new Cart();
      newCart.user = user;
      newCart.items = [item];
      newCart.totalPrice = price * qty;
      await newCart.save();
      return res.status(201).json({
        code: 201,
        status: true,
        message: "added to cart successfully",
        cart: newCart,
      });
    }
  } catch (error) {
    next(error);
  }
};

const removeFromCart=async(req,res,next)=>{
  try{
    const {productId}=req.body
    const user=req.user._id||req.user.id
    const cart= await Cart.findOne({user:user})
    if(!cart){
      res.code=404
      throw new Error("cart not found")
    }
    // ensure we have productId
    if (!productId) {
      res.status(400);
      throw new Error("productId is required");
    }

    // find item index
    const itemIndex = cart.items.findIndex(
      (i) => i.product && i.product.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      res.status(404);
      throw new Error("product not found in cart");
    }

    // remove the item
    cart.items.splice(itemIndex, 1);

    // recompute totalPrice
    cart.totalPrice = cart.items.reduce(
      (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0),
      0
    );

    if (cart.items.length === 0) {
      // remove empty cart
      await Cart.deleteOne({ _id: cart._id });
      return res.status(200).json({
        code: 200,
        status: true,
        message: "item removed; cart is now empty",
        cart: null,
      });
    }

    // save and return updated cart
    await cart.save();
    return res.status(200).json({
      code: 200,
      status: true,
      message: "removed from cart successfully",
      cart,
    });
  }catch(error){
    next(error)
  }
}

const updateCart=async(req,res,next)=>{
  try{
    // product id
    const {productId}=req.params   
    const {newQuantity}=req.body
    const user=req.user._id
    const cart =await Cart.findOne(user)
    if(!cart){
      res.code=404
      throw new Error("cart not found")
    }
    const product=await Product.findById(productId)
    if(!product){
      res.code=404
      throw new Error("product not found")
    }
     const itemIndex = cart.items.findIndex(
       (i) => i.product && i.product.toString() === productId.toString()
     );

      if (itemIndex === -1) {
        res.status(404);
        throw new Error("product not found in cart");
      }

      // remove the item
      cart.items[itemIndex].quantity=Number(newQuantity)

      // recompute totalPrice
      cart.totalPrice = cart.items.reduce(
        (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0),
        0
      );

      // save and return updated cart
      await cart.save();
      return res.status(200).json({
        code: 200,
        status: true,
        message: "updated cart successfully",
        cart,
      });
  }catch(error){
    next(error)
  }
}

const userCart=async(req,res,next)=>{
  try{
    const user=req.user._id
    const cart =await Cart.findOne(user).populate("items.product")
    if(!cart){
      res.code=404
      throw new Error("You have empty cart")
    }
    res.status(200).json({
      code:200,
      status:true,
      message:"cart fetched successfully",
      cart
    })
  }catch(error){
    next(error)
  }
}

const clearCart=async(req,res,next)=>{
  try{
    const user=req.user._id
    const cart=await Cart.findOne(user)
    if(!cart){
      res.code=404
      throw new Error("cart not found")
    }
    cart.items.splice(0,cart.items.length)
    cart.totalPrice=0
    await cart.save()
    res.status(200).json({
      code:200,
      status:true,
      message:"cleared successfully",
      cart
    })
  }catch(error){
    next (error)
  }
}

module.exports = { addToCart,removeFromCart,updateCart,userCart,clearCart };
