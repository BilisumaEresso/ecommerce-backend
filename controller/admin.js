const { User, Order, Product } = require("../model");

/**
 * Dashboard overview
 * Used by AdminDashboard page
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const [users, orders, products] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
    ]);

    res.json({
      status: true,
      data: {
        totalUsers: users,
        totalOrders: orders,
        totalProducts: products,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List all users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 1 }).select("-password");
    res.json({ status: true, data: users });
  } catch (err) {
    next(err);
  }
};

/**
 * List all admins (admin + superAdmin)
 */
const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({
      role: { $in: [2, 3] },
    }).select("-password");

    res.json({ status: true, data: admins });
  } catch (err) {
    next(err);
  }
};

/**
 * Create new admin
 * Used by AddAdminPage
 */
const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const adminExists = await User.findOne({ email });
    if (adminExists) {
      return res.status(400).json({
        status: false,
        message: "Admin already exists",
      });
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: "admin",
    });

    res.status(201).json({
      status: true,
      message: "Admin created successfully",
      data: {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Analytics (simple, extend later)
 * Used by AdminAnalytics page
 */
const getAdminAnalytics = async (req, res, next) => {
  try {
    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    res.json({
      status: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAdminDashboard,
  getAllUsers,
  getAllAdmins,
  createAdmin,
  getAdminAnalytics,
};
