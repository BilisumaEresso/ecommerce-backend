const { Product, File, Review } = require("../model");
const cloudinary = require("../config/cloudinary");
const path = require("path");

const addProduct = async (req, res, next) => {
  try {
    const { name, desc, quantity, price, category } = req.body;

    const productExist = await Product.findOne({ name });
    if (productExist) {
      res.code = 400;
      throw new Error("Product name is taken");
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
    const reviewed = await Review.findOne({
      product: id,
      user: req.user && req.user._id ? req.user._id : req.user.id,
    });
    if (reviewed) {
      res.status(400);
      throw new Error(
        "You already rated this product. Update your review instead."
      );
    }
    // update average properly
    const currentTotal =
      (product.averageRating || 0) * (product.rateNumber || 0);
    product.rateNumber = (product.rateNumber || 0) + 1;
    product.averageRating = (currentTotal + rating) / product.rateNumber;
    await product.save();
    const review = new Review({
      user: req.user && req.user._id ? req.user._id : req.user.id,
      product: id,
      rating,
      comment,
    });
    try {
      await review.save();
    } catch (err) {
      // handle race condition where unique index prevents duplicate reviews
      if (err && err.code === 11000) {
        res.status(400);
        throw new Error(
          "You already rated this product. Update your review instead."
        );
      }
      throw err;
    }
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
      const product = await Product.findById(id);
      if (product) {
        const oldRating = review.rating;
        const rateNumber = product.rateNumber || 0;
        if (rateNumber > 0) {
          const currentTotal = (product.averageRating || 0) * rateNumber;
          const newTotal = currentTotal - oldRating + rating;
          product.averageRating = newTotal / rateNumber;
          await product.save();
        }
      }
      review.rating = rating;
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
      const oldRateNumber = product.rateNumber || 0;
      const oldRating = review.rating || 0;
      const newRateNumber = Math.max(0, oldRateNumber - 1);
      if (newRateNumber === 0) {
        product.averageRating = 0;
        product.rateNumber = 0;
      } else {
        const total = (product.averageRating || 0) * oldRateNumber;
        const newTotal = total - oldRating;
        product.averageRating = newTotal / newRateNumber;
        product.rateNumber = newRateNumber;
      }
      await product.save();
    }
    await Review.findByIdAndDelete(reviewId);
    res
      .status(200)
      .json({ code: 200, status: true, message: "review deleted" });
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
};
