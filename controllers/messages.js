const Message = require("../models/Message");
const Dialog = require("../models/Dialog");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.SECRET;

class messages {
  constructor(io) {
    this.io = io;
  }

  updateReadStatus = (res, userId, dialogId) => {
    Message.updateMany(
      { dialog: dialogId, user: { $ne: userId } },
      { $set: { read: true } },
      (err) => {
        if (err) {
          res.status(500).json({
            status: "error",
            message: err,
          });
        } else {
          this.io.to(dialogId).emit("SERVER:MESSAGES_READED", {
            userId,
            dialogId,
          });
        }
      }
    );
  };

  get(req, res) {
    const index = req.headers.authorization.indexOf(" ");
    const decoded = jwt.verify(
      req.headers.authorization.substring(index + 1),
      secret
    );
    const dialogId = req.query.dialog;
    const userId = decoded.id;
    this.updateReadStatus(res, userId, dialogId);
    Message.find({ dialog: dialogId })
      .populate(["user", "attachments", "audio", "dialog"])
      .exec((err, messages) => {
        if (err) {
          return res.status(404).json({
            status: "error",
            message: "Сообщение не найдено",
          });
        }

        res.json(messages);
      });
  }

  create(req, res) {
    const index = req.headers.authorization.indexOf(" ");
    const decoded = jwt.verify(
      req.headers.authorization.substring(index + 1),
      secret
    );
    const userId = decoded.id;
    const postData = {
      text: req.body.text,
      dialog: req.body.dialog_id,
      attachments: req.body.attachments,
      audio: req.body.audio,
      user: userId,
      date: new Date(),
    };
    const message = new Message(postData);
    this.updateReadStatus(res, userId, req.body.dialog_id);
    message
      .save()
      .then((obj) => {
        obj.populate("user attachments audio dialog", (err, message) => {
          if (err) {
            return res.status(500).json({
              status: "error",
              message: err,
            });
          }
          Dialog.findOneAndUpdate(
            { _id: postData.dialog },
            { lastMessage: message._id },
            { upsert: true },
            (err) => {
              if (err) {
                return res.status(500).json({
                  status: "error",
                  message: err,
                });
              }
            }
          );
          res.json(message);
          this.io.to(postData.dialog).emit("SERVER:NEW_MESSAGE", message);
        });
      })
      .catch((reason) => {
        res.json(reason);
      });
  }

  delete(req, res) {
    const index = req.headers.authorization.indexOf(" ");
    const decoded = jwt.verify(
      req.headers.authorization.substring(index + 1),
      secret
    );
    const id = req.query.id;
    const userId = decoded.id;
    Message.findById(id, (err, message) => {
      if (err || !message) {
        return res.status(404).json({
          status: "error",
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
              return res.status(500).json({
                status: "error",
                message: err,
              });
            }
            Dialog.findById(dialogId, (err, dialog) => {
              if (err) {
                return res.status(500).json({
                  status: "error",
                  message: err,
                });
              }
              if (!dialog) {
                return res.status(404).json({
                  status: "not found",
                  message: err,
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
        res.json({
          status: "success",
          message: "Сообщение удалено",
        });
        this.io
          .to(dialogId)
          .emit("SERVER:REMOVE_MESSAGE", { message: "Сообщение удалено" });
      } else {
        res.status(403).json({
          status: "error",
          message: "Нет прав",
        });
      }
    });
  }
}

module.exports = messages;
