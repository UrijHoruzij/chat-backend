const socket = require("socket.io");
const Socket = (http) => {
  const io = socket(http);
  io.on("connection", (socket) => {
    let user = socket.id;
    socket.on("DIALOGS:JOIN", (dialogId) => {
      socket.dialogId = dialogId;
      socket.join(dialogId);
    });
    socket.on("DIALOGS:TYPING", (obj) => {
      socket.broadcast.emit("DIALOGS:TYPING", obj);
    });
    socket.on("disconnect", () => {});
  });
  return io;
};
module.exports = Socket;
