const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const UploadFileSchema = new Schema({
  filename: {
    type: String,
  },
  size: { type: Number },
  ext: { type: String },
  url: { type: String },
  message: { type: Schema.Types.ObjectId, ref: "Message", require: true },
  user: { type: Schema.Types.ObjectId, ref: "User", require: true },
});

module.exports = UploadFile = mongoose.model("UploadFile", UploadFileSchema);
