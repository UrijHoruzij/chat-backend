const router = require("express").Router();
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Dialog = require("../models/Dialog");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.SECRET;

router.get("/", (req, res) => {
  const decoded = jwt.verify(req.body.token, secret);
  const dialogId = req.body.dialogId;
  Dialog.findById(dialogId, (err) => {
    if (err) {
      return res.status(404).json({ error: "Dialog not found" });
    }
  }).then((dialog) => {
    for (user in dialog.users) {
      if (decoded.id === dialog.users[user]) {
        Message.find({ dialogId: dialogId }, (err) => {
          if (err) {
            return res.status(404).json({ error: "Messages not found" });
          }
        }).then((messages) => {
          return res.status(200).json(messages);
        });
        break;
      }
    }
    return res.status(404).json({ error: "Dialog with the user not found" });
  });
});

router.post("/", (req, res) => {
  const decoded = jwt.verify(req.body.token, secret);
  const dialogId = req.body.dialogId;
  const message = req.body.message;
  Dialog.findById(dialogId, (err) => {
    if (err) {
      return res.status(404).json({ error: "Dialog not found" });
    }
  }).then((dialog) => {
    for (user in dialog.users) {
      if (decoded.id === dialog.users[user]) {
        const newMessage = new Message({
          authorId: decoded.id,
          dialogId: dialogId,
          date: new Date(),
          message: message,
        });
        newMessage
          .save()
          .then((message) => {
            res.json(message);
          })
          .catch((err) => res.status(400).json(err));
        break;
      }
    }
    return res.status(404).json({ error: "Dialog with the user not found" });
  });
});

router.delete("/:id", (req, res) => {
  const decoded = jwt.verify(req.body.token, secret);
  Message.findById(req.params.id, (err) => {
    if (err) {
      return res.status(404).json({ error: "Message not found" });
    }
  }).then((message) => {
    if (decoded.id === message.authorId) {
      Message.deleteOne(message, (err) => {
        if (err) {
          return res.status(502).json({ error: "Message not deleted" });
        }
      }).then(() => {
        return res.status(200).json({ deleted: true });
      });
    }
  });
});

module.exports = router;
