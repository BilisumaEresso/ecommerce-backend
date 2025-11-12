const app = require("./app")
const {port}=require("./config/keys")

app.listen(port,()=>console.log(`listening to port: ${port}` ))
