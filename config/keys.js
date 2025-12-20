const dotenv = require("dotenv")
dotenv.config()
const { PORT, CONNECTION_URL, JWT_KEY} =
  process.env;

module.exports={port:PORT,connectionUrl:CONNECTION_URL,jwtKey:JWT_KEY}
