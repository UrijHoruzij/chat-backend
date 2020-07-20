const router = require("express").Router();
const Dialog = require("../models/Dialog");
const User = require("../models/User");
const Message = require("../models/Message");
const jwt = require("jsonwebtoken");

require("dotenv").config();
const secret = process.env.SECRET;

router.get("/", (req, res) => {
  const decoded = jwt.verify(req.body.token, secret);
  User.findById(decoded.id, (err) => {
    if (err) {
      return res.status(404).json({ error: "Dialogs not found" });
    }
  }).then((user) => {
    return res.status(200).json(user.dialogs);
  });
});

router.post("/", (req, res) => {
  const decoded = jwt.verify(req.body.token, secret);
  const userId = req.body.userId;
  const users = [decoded.id, userId];
  let find = false;
  User.findById(userId, (err) => {
    if (err) {
      return res.status(404).json({ error: "User not found" });
    }
  }).then(() => {
    find = true;
    if (find) {
      let dialogId = "";
      const newDialog = new Dialog({
        users: [decoded.id, userId],
      });
      newDialog
        .save()
        .then((dialog) => {
          dialogId = dialog._id;
          for (user in users) {
            User.findById(users[user], (err) => {
              if (err) {
                return res.status(404).json({ error: "User not found" });
              }
            }).then((user) => {
              const dialogs = user.dialogs;
              dialogs.push(dialogId);
              User.findByIdAndUpdate(user._id, { dialogs: dialogs }, (err) => {
                if (err) {
                  return res
                    .status(500)
                    .json({ error: "Error updated user dialogs" });
                }
              });
              io.emit("SERVER:DIALOG_CREATED", {
                dialog,
              });
            });
          }
          res.status(200).json({ added: true });
        })
        .catch((err) => {
          return res.status(400).json(err);
        });
    }
  });
});

router.delete("/:id", (req, res) => {
  const decoded = jwt.verify(req.body.token, secret);
  Dialog.findById(req.params.id, (err) => {
    if (err) {
      return res.status(404).json({ error: "Dialog not found" });
    }
  })
    .then((dialog) => {
      for (user in dialog.users) {
        if (decoded.id === dialog.users[user]) {
          Dialog.deleteOne(dialog, (err) => {
            if (err) {
              return res.status(502).json({ error: "Dialog not deleted" });
            }
          });
          Message.deleteMany({ dialogId: req.params.id });
        }
      }
      res.status(200).json({ deleted: true });
    })
    .catch(() => {
      res.status(404).json({ error: "Dialog with the user not found" });
    });
});

router.post("/join", (req, res) => {});

module.exports = router;
