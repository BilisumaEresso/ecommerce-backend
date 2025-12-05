const express = require("express");
const connectMongoDb = require("./config/mongoDb");
const { authRoute, categoryRoute, productRouter, orderRouter, cartRouter } = require("./router");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./controller/notFound");
// initialize cloudinary (reads from .env)
require("./config/cloudinary");

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes class
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/order",orderRouter)
app.use("/api/v1/cart",cartRouter)

// connect db
connectMongoDb();

// basic health-check route
app.get("/_health", (req, res) => res.json({ status: "ok" }));
// not found route
app.use("", notFound);
// error handler
app.use(errorHandler);

module.exports = app;
