const { check } = require("express-validator");

const addReviewValidator = [
  check("rating")
    .exists()
    .withMessage("rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("rating must be an integer between 1 and 5"),
  check("comment")
    .optional()
    .isString()
    .isLength({ max: 300 })
    .withMessage("comment must be under 300 chars"),
];

module.exports = { addReviewValidator };
