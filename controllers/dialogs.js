const Dialog = require("../models/Dialog");
const User = require("../models/User");
const Message = require("../models/Message");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.SECRET;

class dialogs {
  getDialogs(data, socket) {
    const { token } = data;
    try {
      const decoded = jwt.verify(token, secret);
      Dialog.find({ $or: [{ author: decoded.id }, { partner: decoded.id }] })
        .populate(["author", "partner"])
        .populate({
          path: "lastMessage",
          populate: {
            path: "user",
          },
        })
        .exec((err, dialogs) => {
          if (err) {
            return socket.emit("USER:GET_DIALOGS", {
              status: 404,
              message: "Диалог не найден",
            });
          }
          return socket.emit("USER:GET_DIALOGS", {
            status: 200,
            dialogs,
          });
        });
    } catch (error) {
      socket.emit("USER:GET_DIALOGS", {
        status: 401,
        message: error,
      });
    }
  }

  create(data, socket, io) {
    const { partner, text, token } = data;
    try {
      const decoded = jwt.verify(token, secret);
      const postData = {
        author: decoded.id,
        partner: partner,
      };
      Dialog.findOne(
        {
          author: decoded.id,
          partner: partner,
        },
        (err, dialog) => {
          if (err) {
            return socket.emit("USER:CREATE_DIALOG", {
              status: 500,
              message: err,
            });
          }
          if (dialog) {
            return socket.emit("USER:CREATE_DIALOG", {
              status: 403,
              message: "Такой диалог уже есть",
            });
          } else {
            const dialogNew = new Dialog(postData);
            dialogNew
              .save()
              .then((dialogObj) => {
                const message = new Message({
                  text: text,
                  user: decoded.id,
                  dialog: dialogObj._id,
                  date: new Date(),
                });
                message
                  .save()
                  .then((message) => {
                    Dialog.findByIdAndUpdate(dialogObj._id, {
                      lastMessage: message._id,
                    }).then((newDialog) => {
                      socket.emit("USER:CREATE_DIALOG", {
                        status: 200,
                        newDialog,
                      });
                      io.emit("SERVER:DIALOG_CREATED", {
                        ...postData,
                        dialog: newDialog,
                      });
                    });
                  })
                  .catch((reason) => {
                    socket.emit("USER:CREATE_DIALOG", {
                      status: 500,
                      message: reason,
                    });
                  });
              })
              .catch((error) => {
                socket.emit("USER:CREATE_DIALOG", {
                  status: 500,
                  message: error,
                });
              });
          }
        }
      );
    } catch (error) {
      socket.emit("USER:CREATE_DIALOG", {
        status: 401,
        message: error,
      });
    }
  }

  delete(data, socket) {
    const { id, token } = data;
    try {
      const decoded = jwt.verify(token, secret);
      Dialog.findOneAndRemove({
        $or: [
          { _id: id, author: decoded.id },
          { _id: id, partner: decoded.id },
        ],
      })
        .then((dialog) => {
          if (dialog) {
            User.findByIdAndUpdate(decoded.id, { $pull: { dialogs: id } }).then(
              () => {
                User.findByIdAndUpdate(dialog.partner._id, {
                  $pull: { dialogs: id },
                });
              }
            );
            Message.deleteMany({ dialogId: id });
            socket.emit("USER:REMOVE_DIALOG", {
              status: 200,
              message: "Диалог удален",
            });
          }
        })
        .catch(() => {
          socket.emit("USER:REMOVE_DIALOG", {
            status: 404,
            message: "Диалог не найден",
          });
        });
    } catch (error) {
      socket.emit("USER:REMOVE_DIALOG", {
        status: 401,
        message: error,
      });
    }
  }
}

module.exports = dialogs;
