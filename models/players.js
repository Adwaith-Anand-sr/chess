const mongoose = require("mongoose");

let playerSchema = mongoose.Schema({
   roomId : Number,
   name: String,
   id: String,
   role: String
})

module.exports = mongoose.model("player", playerSchema)