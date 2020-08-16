const User = require("../models/User");

class updateLastSeen {
  add = (id, socket) => {
    User.findOneAndUpdate(
      { _id: id },
      {
        isOnline: true,
        socket: socket,
      }
    ).then();
  };
  remove = (socket) => {
    User.findOneAndUpdate(
      { socket: socket },
      {
        isOnline: false,
        socket: "",
        lastSeen: new Date(),
      }
    ).then();
  };
}
module.exports = updateLastSeen;
