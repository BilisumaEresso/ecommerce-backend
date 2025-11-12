const dotenv = require("dotenv")
dotenv.config()
const {PORT,CONNECTION_URL}=process.env

module.exports={port:PORT,connectionUrl:CONNECTION_URL}
