const mongoose = require("mongoose");

let groupeSchema = mongoose.Schema({
   roomId : Number,
   id: String,
   members : []
})

module.exports = mongoose.model("group", groupeSchema)