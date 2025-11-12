const express = require("express");
const connectMongoDb = require("./config/mongoDb");
const { authRoute } = require("./router");

const app = express();

// middleware
app.use(express.json());

// routes class
app.use("/api/v1/auth", authRoute);

// connect db
connectMongoDb();

// basic health-check route
app.get("/_health", (req, res) => res.json({ status: "ok" }));

module.exports = app;
