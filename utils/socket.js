const socket = require("socket.io");
const authClass = require("../controllers/auth");
const auth = new authClass();
const userClass = require("../controllers/user");
const user = new userClass();
const dialogsClass = require("../controllers/dialogs");
const dialogs = new dialogsClass();
const messagesClass = require("../controllers/messages");
const messages = new messagesClass();

const updateLastSeenClass = require("./updateLastSeen");
const updateLastSeen = new updateLastSeenClass();

const Socket = (http) => {
  const io = socket(http);

  io.on("connection", (socket) => {
    socket.on("USER:SIGNUP", (data) => {
      auth.signup(data, socket);
    });
    socket.on("USER:SIGNIN", (data) => {
      auth.signin(data, socket, io);
    });
    socket.on("USER:REFRESH", (data) => {
      auth.refresh(data, socket);
    });
    socket.on("USER:LOGOUT", (data) => {
      auth.logout(data, socket, io);
    });

    socket.on("USER:GET_ME", (data) => {
      user.getMe(data, socket);
    });
    socket.on("USER:SET_AVATAR", (data) => {
      user.setAvatar(data, socket);
    });
    socket.on("USER:SET_FULLNAME", (data) => {
      user.setFullname(data, socket);
    });
    socket.on("USER:FIND", (data) => {
      user.find(data, socket);
    });
    socket.on("USER:FIND_ID", (data) => {
      user.findId(data, socket);
    });
    socket.on("USER:DELETE", (data) => {
      user.delete(data, socket);
    });

    socket.on("USER:GET_MESSAGES", (data) => {
      messages.getMessages(data, socket, io);
    });
    socket.on("USER:CREATE_MESSAGE", (data) => {
      messages.create(data, socket, io);
    });
    socket.on("USER:REMOVE_MESSAGE", (data) => {
      messages.remove(data, socket, io);
    });

    socket.on("USER:GET_DIALOGS", (data) => {
      dialogs.getDialogs(data, socket);
    });
    socket.on("USER:CREATE_DIALOG", (data) => {
      dialogs.create(data, socket, io);
    });
    socket.on("USER:REMOVE_DIALOG", (data) => {
      dialogs.delete(data, socket);
    });

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
      updateLastSeen.remove(socket.id);
      socket.broadcast.emit("SERVER:USER_ONLINE", { isOnline: false });
    });
  });
  return io;
};
module.exports = Socket;
