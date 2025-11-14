const express = require("express");
const connectMongoDb = require("./config/mongoDb");
const { authRoute, categoryRoute } = require("./router");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./controller/notFound");

const app = express();

// middleware
app.use(express.json());

// routes class
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/category",categoryRoute)

// connect db
connectMongoDb();

// basic health-check route
app.get("/_health", (req, res) => res.json({ status: "ok" }));
// not found route
app.use("",notFound)
// error handler
app.use(errorHandler)

module.exports = app;
