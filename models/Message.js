const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  authorId: {
    type: String,
    required: true,
  },
  dialogId: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

module.exports = Message = mongoose.model("Message", MessageSchema);
