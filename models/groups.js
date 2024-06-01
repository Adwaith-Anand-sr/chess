const mongoose = require("mongoose");

let groupeSchema = mongoose.Schema({
   roomId : Number,
   id: String,
   members : [],
   turn: {
      type: String,
      default: "w"
   }
})

module.exports = mongoose.model("group", groupeSchema)