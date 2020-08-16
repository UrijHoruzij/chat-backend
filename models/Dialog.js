const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const DialogSchema = new mongoose.Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  partner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: "Message",
  },
});

module.exports = Dialog = mongoose.model("Dialog", DialogSchema);
