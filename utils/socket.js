const socket = require("socket.io");
const updateLastSeenClass = require("./updateLastSeen");

const updateLastSeen = new updateLastSeenClass();

const Socket = (http) => {
  const io = socket(http);
  io.on("connection", (socket) => {
    const id = socket.id;
    socket.on("DIALOGS:JOIN", (dialogId) => {
      socket.dialogId = dialogId;
      socket.join(dialogId);
    });
    socket.on("SERVER:USER_AVATAR_UPDATE", () => {
      socket.to(socket.dialogId).emit("SERVER:USER_AVATAR_UPDATE");
    });
    socket.on("DIALOGS:TYPING", (obj) => {
      socket.broadcast.to(obj.dialogId).emit("DIALOGS:TYPING", obj);
    });
    socket.on("disconnect", () => {
      updateLastSeen.remove(id);
      socket.broadcast.emit("SERVER:USER_ONLINE");
    });
  });
  return io;
};
module.exports = Socket;
