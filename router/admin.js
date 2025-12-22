const express = require("express");
const router = express.Router();

const isAuth = require("../middleware/isAuth");
const isSuperAdmin = require("../middleware/isSuperAdmin");

const {adminController} = require("../controller");

// All admin routes are protected
router.use(isAuth, isSuperAdmin);

// Dashboard overview
router.get("/dashboard", adminController.getAdminDashboard);

// Users & admins
router.get("/users", adminController.getAllUsers);
router.get("/admins", adminController.getAllAdmins);
router.post("/admins", adminController.createAdmin);

// Analytics
router.get("/analytics", adminController.getAdminAnalytics);

module.exports = router;
