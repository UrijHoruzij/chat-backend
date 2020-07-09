const mongoose = require("mongoose");

const DialogSchema = new mongoose.Schema({
  _id: mongoose.Types.ObjectId,
  name: {
    type: String,
    required: true,
  },
  users: {
    type: Array,
    required: true,
  },
});
module.exports = DialogSchema;
