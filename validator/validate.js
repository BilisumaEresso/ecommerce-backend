const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.code=400
    throw new Error(errors.errors[0].msg);
  }
  next();
};

module.exports = validate;
