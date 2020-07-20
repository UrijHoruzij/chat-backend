const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  refreshToken: {
    token: {
      type: String,
    },
    fingerprint: {
      type: Object,
    },
  },
  fullname: {
    name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
  },
  dialogs: {
    type: Array,
  },
  avatar: {
    type: String,
  },
  online: {
    type: Boolean,
  },
  last_seen: {
    type: Date,
    default: new Date(),
  },
});

module.exports = User = mongoose.model("User", UserSchema);
