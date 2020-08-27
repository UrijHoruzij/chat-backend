const Message = require("../models/Message");
const Dialog = require("../models/Dialog");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.SECRET;

class messages {
  updateReadStatus = (socket, io, userId, dialogId) => {
    Message.updateMany(
      { dialog: dialogId, user: { $ne: userId } },
      { $set: { read: true } },
      (err) => {
        if (err) {
          socket.emit("SERVER:MESSAGES_READED", { status: 500, message: err });
        } else {
          io.to(dialogId).emit("SERVER:MESSAGES_READED", {
            userId,
            dialogId,
          });
        }
      }
    );
  };

  getMessages(data, socket, io) {
    const { token, dialogId } = data;
    try {
      const decoded = jwt.verify(token, secret);
      const userId = decoded.id;
      this.updateReadStatus(socket, io, userId, dialogId);
      Message.find({ dialog: dialogId })
        .populate(["user", "attachments", "audio", "dialog"])
        .exec((err, messages) => {
          if (err) {
            return socket.emit("USER:GET_MESSAGES", {
              status: 404,
              message: "Сообщений не найдено",
            });
          }
          socket.emit("USER:GET_MESSAGES", { status: 200, messages });
        });
    } catch (error) {
      socket.emit("USER:GET_MESSAGES", { status: 401, message: error });
    }
  }

  create(data, socket, io) {
    const { token, text, dialogId, attachments, audio } = data;
    try {
      const decoded = jwt.verify(token, secret);
      const userId = decoded.id;
      const postData = {
        text: text,
        dialog: dialogId,
        attachments: attachments,
        audio: audio,
        user: userId,
        date: new Date(),
      };
      const message = new Message(postData);
      this.updateReadStatus(socket, io, userId, dialogId);
      message
        .save()
        .then((obj) => {
          obj.populate("user attachments audio dialog", (err, message) => {
            if (err) {
              return socket.emit("USER:CREATE_MESSAGE", {
                status: 500,
                message: err,
              });
            }
            Dialog.findOneAndUpdate(
              { _id: postData.dialog },
              { lastMessage: message._id },
              { upsert: true },
              (err) => {
                if (err) {
                  return socket.emit("USER:CREATE_MESSAGE", {
                    status: 500,
                    message: err,
                  });
                }
              }
            );
            socket.emit("USER:CREATE_MESSAGE", { status: 200, message });
            io.to(postData.dialog).emit("SERVER:NEW_MESSAGE", message);
          });
        })
        .catch((reason) => {
          socket.emit("USER:CREATE_MESSAGE", { status: 404, message: reason });
        });
    } catch (error) {
      socket.emit("USER:CREATE_MESSAGE", { status: 401, message: error });
    }
  }

  remove(data, socket, io) {
    const { id, token } = data;
    try {
      const decoded = jwt.verify(token, secret);
      const userId = decoded.id;
      Message.findById(id, (err, message) => {
        if (err || !message) {
          return socket.emit("USER:REMOVE_MESSAGE", {
            status: 404,
            message: "Сообщение не найдено",
          });
        }
        if (message.user.toString() === userId) {
          const dialogId = message.dialog;
          message.remove();
          Message.findOne(
            { dialog: dialogId },
            {},
            { sort: { date: -1 } },
            (err, lastMessage) => {
              if (err) {
                return socket.emit("USER:REMOVE_MESSAGE", {
                  status: 500,
                  message: err,
                });
              }
              Dialog.findById(dialogId, (err, dialog) => {
                if (err) {
                  return socket.emit("USER:REMOVE_MESSAGE", {
                    status: 500,
                    message: err,
                  });
                }
                if (!dialog) {
                  return socket.emit("USER:REMOVE_MESSAGE", {
                    status: 404,
                    message: "Сообщение не найдено",
                  });
                }
                Message.find({ dialog: dialogId })
                  .populate(["user", "attachments", "audio", "dialog"])
                  .exec((err, messages) => {
                    dialog.lastMessage = messages[messages.length - 1];
                    dialog.save();
                  });
              });
            }
          );
          socket.emit("USER:REMOVE_MESSAGE", {
            status: 200,
            message: "Сообщение удалено",
          });
          io.to(dialogId).emit("SERVER:REMOVE_MESSAGE", {
            message: "Сообщение удалено",
          });
        } else {
          socket.emit("USER:REMOVE_MESSAGE", {
            status: 403,
            message: "Нет прав",
          });
        }
      });
    } catch (error) {
      socket.emit("USER:REMOVE_MESSAGE", { status: 401, message: error });
    }
  }
}

module.exports = messages;
