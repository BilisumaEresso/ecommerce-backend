const { check } = require("express-validator")

const signupValidator = [
  check("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid email format"),
  check("name")
    .notEmpty()
    .withMessage("name is required")
    .isLength({ min: 3, max: 25 })
    .withMessage("name should be 3-25 characters long"),
  check("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 5 })
    .withMessage("password must be at least 5 characters log"),
];

const loginValidator=[
    check("email")
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid email format"),
    check("password").notEmpty().withMessage("password is required")
]


module.exports={signupValidator,loginValidator}