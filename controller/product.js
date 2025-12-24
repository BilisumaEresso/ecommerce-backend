const { Product, File, Review, Category } = require("../model");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const path = require("path");
const {validateAiSearch}=require("../validator/aiSearch")
const {aiSearchIntent}=require("../services/ai/aiSearch.services")
// const { escape } = require("querystring");

const addProduct = async (req, res, next) => {
  try {
    const { name, desc, quantity, price, category } = req.body;

    const productExist = await Product.findOne({ name });
    if (productExist) {
      res.code = 400;
      throw new Error("Product name is taken");
    }
    const isCategory= await Category.findById(category)
    if(!isCategory){
      throw new Error("category doesn't exist")
    }
    const product = new Product();
    product.name = name;
    product.desc = desc;
    product.quantity = quantity;
    product.price = price;
    product.category = category;
    // attach the authenticated user as creator if available
    if (req.user && req.user._id) product.createdBy = req.user._id;
    else if (req.user && req.user.id) product.createdBy = req.user.id;
    // If files were provided, upload them to Cloudinary and create File docs
    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          // convert buffer to data uri
          const base64 = file.buffer.toString("base64");
          const dataUri = `data:${file.mimetype};base64,${base64}`;
          const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: "ecommerce/products",
          });
          const newFile = new File({
            name: file.originalname,
            size: file.size.toString(),
            type:
              path.extname(file.originalname).replace(".", "") || file.mimetype,
            signedUrl: uploadResult.secure_url,
            public_id: uploadResult.public_id,
          });
          await newFile.save();
          uploadedFiles.push(newFile);
          product.photo.push(newFile._id);
        }
      } catch (err) {
        // rollback any saved file docs & cloudinary resources if any
        for (const f of uploadedFiles) {
          // remove file document
          await File.findByIdAndDelete(f._id).catch(() => {});
          // delete cloudinary resource using public_id
          if (f.public_id)
            await cloudinary.uploader.destroy(f.public_id).catch(() => {});
        }
        throw err;
      }
    }

    await product.save();
    // populate the photo field to include file objects with signedUrl
    const populated = await Product.findById(product._id).populate("photo");
    res.status(201).json({
      code: 200,
      status: true,
      message: "product added successfully",
      product: populated,
      uploadedFiles: uploadedFiles.map((f) => ({
        _id: f._id,
        name: f.name,
        signedUrl: f.signedUrl,
        public_id: f.public_id,
        size: f.size,
        type: f.type,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const addProductImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const base64 = file.buffer.toString("base64");
          const dataUri = `data:${file.mimetype};base64,${base64}`;
          const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: "ecommerce/products",
          });
          const newFile = new File({
            name: file.originalname,
            size: file.size.toString(),
            type:
              path.extname(file.originalname).replace(".", "") || file.mimetype,
            signedUrl: uploadResult.secure_url,
            public_id: uploadResult.public_id,
          });
          await newFile.save();
          uploadedFiles.push(newFile);
          product.photo.push(newFile._id);
        }
        res.status(201).json({
          code: 201,
          status: true,
          message: "uploaded successfully",
        });
      } catch (err) {
        for (const f of uploadedFiles) {
          await File.findByIdAndDelete(f._id).catch(() => {});
          if (f.public_id)
            await cloudinary.uploader.destroy(f.public_id).catch(() => {});
        }
        throw err;
      }
    }

    await product.save();
    const populated = await Product.findById(product._id).populate("photo");
    res.status(200).json({
      code: 200,
      status: true,
      message: "images uploaded and attached to product",
      product: populated,
      uploadedFiles: uploadedFiles.map((f) => ({
        _id: f._id,
        name: f.name,
        signedUrl: f.signedUrl,
        public_id: f.public_id,
        size: f.size,
        type: f.type,
      })),
    });
  } catch (error) {
    next(error);
  }
};
const searchProducts = async (req, res, next) => {
  try {
    const q = req.query.q?.trim();
    if (!q) {
      return res.json(await Product.find());
    }

    const isComplex = q.split(" ").length > 3;

    if (!isComplex) {
      const products = await Product.find({
        $text: { $search: q },
      });
      return res.json({
        status:true,
        message:"product fetched successfully",
        products:products
      });
    }

    const aiResult = await aiSearchIntent(q);

    const categories = await Category.find().select("name");
    const allowedCategories = categories.map((c) => c.name);

    const filters = validateAiSearch(aiResult, allowedCategories);
    if (!filters) throw new Error("AI validation failed");

    const mongoQuery = {};

    if (filters.keywords.length) {
      mongoQuery.$text = { $search: filters.keywords.join(" ") };
    }

    if (filters.category) {
      const cat = await Category.findOne({ name: filters.category });
      if (cat) mongoQuery.category = cat._id;
    }

    if (filters.price.min || filters.price.max) {
      mongoQuery.price = {};
      if (filters.price.min) mongoQuery.price.$gte = filters.price.min;
      if (filters.price.max) mongoQuery.price.$lte = filters.price.max;
    }

    let sort = {};
    if (filters.sort === "price_asc") sort.price = 1;
    if (filters.sort === "price_desc") sort.price = -1;
    if (filters.sort === "popular") sort.sold = -1;
    if (filters.sort === "newest") sort.createdAt = -1;

    const products = await Product.find(mongoQuery).populate("photo").sort(sort);
    res.status(200).json({
      status: true,
      message: "product fetched successfully",
      products: products,
    });
  } catch (err) {
    next(err);
  }
};
const getProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    let filter = {};

    if (q) {
      filter = {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { desc: { $regex: q, $options: "i" } },
          { price: { $regex: q, $options: "i" } },
        ],
      };
      const products = await Product.find(filter).populate("photo");
      if (products.length < 1) {
        throw new Error("product is not found !!");
      } else {
        const products = await Product.find().populate("photo");
        res.status(200).json({ code: 200, status: true, products });
      }
    } else {
      const products = await Product.find().populate("photo");
      res.status(200).json({ code: 200, status: true, products });
    }
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate("photo") // populate
      .populate("createdBy", "name email");
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    res.status(200).json({ code: 200, status: true, product });
  } catch (error) {
    next(error);
  }
};

const getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const products = await Product.find({ category: categoryId }).populate(
      "photo"
    );
    res.status(200).json({ code: 200, status: true, products });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, desc, quantity, price, category } = req.body;
    const product = await Product.findById(id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    // update fields
    if (name) product.name = name;
    if (desc) product.desc = desc;
    if (quantity) product.quantity = quantity;
    if (price) product.price = price;
    if (category) product.category = category;

    // handle new images if provided
    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      try {
        for (const file of req.files) {
          const base64 = file.buffer.toString("base64");
          const dataUri = `data:${file.mimetype};base64,${base64}`;
          const uploadResult = await cloudinary.uploader.upload(dataUri, {
            folder: "ecommerce/products",
          });
          const newFile = new File({
            name: file.originalname,
            size: file.size.toString(),
            type:
              path.extname(file.originalname).replace(".", "") || file.mimetype,
            signedUrl: uploadResult.secure_url,
            public_id: uploadResult.public_id,
          });
          await newFile.save();
          uploadedFiles.push(newFile);
          product.photo.push(newFile._id);
        }
      } catch (err) {
        for (const f of uploadedFiles) {
          await File.findByIdAndDelete(f._id).catch(() => {});
          if (f.public_id)
            await cloudinary.uploader.destroy(f.public_id).catch(() => {});
        }
        throw err;
      }
    }

    await product.save();
    const populated = await Product.findById(product._id).populate("photo");
    res.status(200).json({
      code: 200,
      status: true,
      product: populated,
      uploadedFiles: uploadedFiles.map((f) => ({
        _id: f._id,
        name: f.name,
        signedUrl: f.signedUrl,
        public_id: f.public_id,
        size: f.size,
        type: f.type,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    // delete associated files (both Cloudinary and in DB)
    if (product.photo && product.photo.length > 0) {
      const files = await File.find({ _id: { $in: product.photo } });
      for (const f of files) {
        if (f.public_id)
          await cloudinary.uploader.destroy(f.public_id).catch(() => {});
        await File.findByIdAndDelete(f._id).catch(() => {});
      }
    }
    await Product.findByIdAndDelete(id);
    res
      .status(200)
      .json({ code: 200, status: true, message: "product deleted" });
  } catch (error) {
    next(error);
  }
};

// Reviews
// helper: recompute product aggregate ratings from reviews
const recomputeProductStats = async (productId) => {
  // ensure a valid ObjectId is used
  const oid = mongoose.isValidObjectId(productId)
    ? new mongoose.Types.ObjectId(productId)
    : productId;
  const res = await Review.aggregate([
    { $match: { product: oid } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        rateNumber: { $sum: 1 },
      },
    },
  ]);
  if (res && res.length > 0) {
    const { averageRating, rateNumber } = res[0];
    await Product.findByIdAndUpdate(productId, {
      averageRating: averageRating || 0,
      rateNumber: rateNumber || 0,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      averageRating: 0,
      rateNumber: 0,
    });
  }
};
const addReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    if (!rating) {
      res.status(400);
      throw new Error("rating is required");
    }
    const product = await Product.findById(id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    const userId = req.user && req.user._id ? req.user._id : req.user.id;
    const existing = await Review.findOne({ product: id, user: userId });
    if (existing) {
      // update the existing review (upsert behavior)
      const oldRating = existing.rating;
      if (rating) existing.rating = rating;
      if (comment) existing.comment = comment;
      await existing.save();
      // recompute product stats after update
      await recomputeProductStats(id);
      return res
        .status(200)
        .json({ code: 200, status: true, review: existing });
    }
    // create new review
    const review = new Review({
      user: userId,
      product: id,
      rating,
      comment,
    });
    try {
      await review.save();
    } catch (err) {
      if (err && err.code === 11000) {
        // unique constraint hit, return helpful message
        res.status(400);
        throw new Error(
          "You already rated this product. Update your review instead."
        );
      }
      throw err;
    }
    // recompute stats
    await recomputeProductStats(id);
    res.status(201).json({ code: 201, status: true, review });
  } catch (error) {
    next(error);
  }
};

const updateReview = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params; // product id, review id
    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404);
      throw new Error("Review not found");
    }
    // allow update if user is owner or admin
    const userId =
      req.user && req.user._id ? req.user._id.toString() : req.user.id;
    if (review.user.toString() !== userId && !(req.user && req.user.isAdmin)) {
      res.status(403);
      throw new Error("not authorized to update review");
    }
    const { rating, comment } = req.body;
    // If rating changed, update product averages
    if (rating && rating !== review.rating) {
      // update rating
      review.rating = rating;
      // recompute product stats for accuracy
      await recomputeProductStats(id);
    }
    if (comment) review.comment = comment;
    await review.save();
    res.status(200).json({ code: 200, status: true, review });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) {
      res.status(404);
      throw new Error("Review not found");
    }
    const userId =
      req.user && req.user._id ? req.user._id.toString() : req.user.id;
    if (review.user.toString() !== userId && !(req.user && req.user.isAdmin)) {
      res.status(403);
      throw new Error("not authorized to delete review");
    }
    // update product rating stats
    const product = await Product.findById(id);
    if (product) {
      await recomputeProductStats(product._id);
    }
    await Review.findByIdAndDelete(reviewId);
    res
      .status(200)
      .json({ code: 200, status: true, message: "review deleted" });
  } catch (error) {
    next(error);
  }
};

const getReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) {
      res.code = 404;
      throw new Error("review not found");
    }
    res.status(200).json({
      code: 200,
      review: review,
    });
  } catch (error) {
    next(error);
  }
};

const getUserReview = async (req, res, next) => {
  try {
    const { id } = req.params; // product id
    const userId = req.user && req.user._id ? req.user._id : req.user.id;
    const review = await Review.findOne({ product: id, user: userId });
    if (!review) {
      return res
        .status(404)
        .json({ code: 404, status: false, message: "review not found" });
    }
    res.status(200).json({ code: 200, status: true, review });
  } catch (error) {
    next(error);
  }
};

const getAllReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      res.code;
      throw new Error("product not found");
    }
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [reviews, count] = await Promise.all([
      Review.find({ product: id })
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .populate("user", "name email"),
      Review.countDocuments({ product: id }),
    ]);
    if (!reviews || reviews.length === 0) {
      return res.status(200).json({
        code: 200,
        status: true,
        message: "no reviews yet",
        reviews: [],
        product,
      });
    }
    res.status(200).json({
      code: 200,
      status: true,
      message: "fetched successfully",
      reviews,
      product,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        pages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addProduct,
  addProductImages,
  getProducts,
  getProductById,
  getProductsByCategory,
  updateProduct,
  deleteProduct,
  addReview,
  updateReview,
  deleteReview,
  getReview,
  getAllReview,
  getUserReview,
  searchProducts,
};
