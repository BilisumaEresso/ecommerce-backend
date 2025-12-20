const express = require("express");
const { productController } = require("../controller");
const isAuth = require("../middleware/isAuth");
const isAdmin = require("../middleware/isAdmin");
const { addProductValidator } = require("../validator/product");
const { addReviewValidator } = require("../validator/review");
const validate = require("../validator/validate");
const multer = require("multer");
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  // accept image files only
  if (file.mimetype && file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

router.post(
  "/",
  isAuth,
  isAdmin,
  addProductValidator,
  validate,
  productController.addProduct
);
// add images to existing product
router.post(
  "/:id/images",
  isAuth,
  isAdmin,
  upload.array("images", 6),
  productController.addProductImages
);
router.put(
  "/:id",
  isAuth,
  isAdmin,
  upload.array("images", 6),
  productController.updateProduct
);
router.delete("/:id", isAuth, isAdmin, productController.deleteProduct);
router.get("/", productController.getProducts);
router.get("/ai-search",productController.searchProducts)
router.get("/category/:categoryId", productController.getProductsByCategory);
router.get("/:id", productController.getProductById);

router.post(
  "/:id/review",
  isAuth,
  addReviewValidator,
  validate,
  productController.addReview
);
router.patch(
  "/:id/review/:reviewId",
  isAuth,
  addReviewValidator,
  validate,
  productController.updateReview
);
router.delete("/:id/review/:reviewId", isAuth, productController.deleteReview);
// reviews listing and individual user review
router.get("/:id/reviews", productController.getAllReview);
router.get("/:id/review", isAuth, productController.getUserReview);
router.get("/review/:id", isAuth, productController.getReview);
// (removed duplicate route) - '/:id/review' should return the current user's review via getUserReview

module.exports = router;
