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
    default: new Date(),
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  attachments: {
    type: String,
  },
});

module.exports = Message = mongoose.model("Message", MessageSchema);
