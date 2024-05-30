const mongoose = require("mongoose");
let pass = "adwaith.6574"
let dbName = "chess"
let uri = `mongodb+srv://sreeadwa:${pass}@cluster0.dubqcyd.mongodb.net/${dbName}?retryWrites=true&w=majority&appName=Cluster0`

mongoose.connect(uri).then(()=>{
   console.log("connected to mongodb");
})

module.exports = mongoose