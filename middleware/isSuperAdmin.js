const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: false,
      message: "Unauthorized",
    });
  }

  if (req.user.role !== 3) {
    return res.status(403).json({
      status: false,
      message: "Access denied: Super Admin only",
    });
  }

  next();
};

module.exports =isSuperAdmin;
