const mongoose = require("mongoose");

const DialogSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  users: {
    type: Array,
    required: true,
  },
  avatar: {
    type: String,
  },
});

module.exports = Dialog = mongoose.model("Dialog", DialogSchema);
