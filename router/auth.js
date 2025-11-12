const express = require("express");
const router = express.Router();

router.post("/signup", (req, res, next) => {
  console.log("request sent successfully");
  return res.status(201).json({ message: "signup received", body: req.body });
});

module.exports = router;
