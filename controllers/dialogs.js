const Dialog = require("../models/Dialog");
const User = require("../models/User");
const Message = require("../models/Message");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.SECRET;

class dialogs {
  constructor(io) {
    this.io = io;
  }

  get(req, res) {
    const index = req.headers.authorization.indexOf(" ");
    const decoded = jwt.verify(
      req.headers.authorization.substring(index + 1),
      secret
    );
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
          return res.status(404).json({
            message: "Диалог не найден",
          });
        }
        return res.json(dialogs);
      });
  }

  create(req, res) {
    const index = req.headers.authorization.indexOf(" ");
    const decoded = jwt.verify(
      req.headers.authorization.substring(index + 1),
      secret
    );
    const postData = {
      author: decoded.id,
      partner: req.body.partner,
    };
    Dialog.findOne(
      {
        author: decoded.id,
        partner: req.body.partner,
      },
      (err, dialog) => {
        if (err) {
          return res.status(500).json({
            status: "error",
            message: err,
          });
        }
        if (dialog) {
          return res.status(403).json({
            status: "error",
            message: "Такой диалог уже есть",
          });
        } else {
          const dialogNew = new Dialog(postData);
          dialogNew
            .save()
            .then((dialogObj) => {
              const message = new Message({
                text: req.body.text,
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
                    res.json(newDialog);
                    this.io.emit("SERVER:DIALOG_CREATED", {
                      ...postData,
                      dialog: newDialog,
                    });
                  });
                })
                .catch((reason) => {
                  res.json(reason);
                });
            })
            .catch((error) => {
              res.status(500).json({
                status: "error",
                message: error,
              });
            });
        }
      }
    );
  }

  delete(req, res) {
    const index = req.headers.authorization.indexOf(" ");
    const decoded = jwt.verify(
      req.headers.authorization.substring(index + 1),
      secret
    );
    const id = req.params.id;
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
          res.json({
            message: `Диалог удален`,
          });
        }
      })
      .catch(() => {
        res.json({
          message: `Диалог не найден`,
        });
      });
  }
}

module.exports = dialogs;
