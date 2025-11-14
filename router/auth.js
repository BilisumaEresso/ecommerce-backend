const express = require("express");
const { authController } = require("../controller");
const isAuth = require("../middleware/isAuth");
const {signupValidator, loginValidator} = require("../validator/auth");
const  validate  = require("../validator/validate");
const router = express.Router();

router.post("/signup",signupValidator,validate, authController.signup)
router.get("/login",loginValidator,validate,authController.login)
router.put("/update",isAuth,authController.updateProfile)
router.put("/change-password",isAuth,authController.changePassword)

module.exports = router;
