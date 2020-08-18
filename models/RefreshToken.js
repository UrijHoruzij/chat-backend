const mongoose = require("mongoose");
const RefreshTokenSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  refresh: {
    type: String,
    require: true,
  },
});

module.exports = RefreshToken = mongoose.model(
  "RefreshToken",
  RefreshTokenSchema
);
