const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const differenceInMinutes = "date-fns/difference_in_minutes";
const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  dialogs: {
    type: Array,
  },
  avatar: {
    type: String,
  },
  socket: {
    type: String,
  },
  lastSeen: {
    type: String,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
});

module.exports = User = mongoose.model("User", UserSchema);
