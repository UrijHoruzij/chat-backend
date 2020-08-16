const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const MessageSchema = new mongoose.Schema({
  text: {
    type: String,
    require: Boolean,
  },
  dialog: {
    type: Schema.Types.ObjectId,
    ref: "Dialog",
    require: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    require: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  audio: {
    type: Schema.Types.ObjectId,
    ref: "UploadFile",
  },
  attachments: [
    {
      type: Schema.Types.ObjectId,
      ref: "UploadFile",
    },
  ],
  date: {
    type: String,
    require: true,
  },
});

module.exports = Message = mongoose.model("Message", MessageSchema);
