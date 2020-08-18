const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.SECRET;

class user {
  constructor(io) {
    this.io = io;
  }

  get(req, res) {
    const index = req.headers.authorization.indexOf(" ");
    const decoded = jwt.verify(
      req.headers.authorization.substring(index + 1),
      secret
    );
    User.findById(decoded.id, (err, user) => {
      if (err || !user) {
        return res.status(404).json({
          message: "Пользователь не найден",
        });
      }
      const me = {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        dialogs: user.dialogs,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        timeToken: decoded.exp,
      };
      res.json(me);
    });
  }

  find(req, res) {
    const email = req.query.email;
    User.find({ email: new RegExp(email, "i") })
      .then((users) => {
        let result = [];
        for (let user in users) {
          let info = {
            _id: users[user]._id,
            fullname: users[user].fullname,
            email: users[user].email,
            dialogs: users[user].dialogs,
            avatar: users[user].avatar,
            isOnline: users[user].isOnline,
            lastSeen: users[user].lastSeen,
          };
          result[`${user}`] = info;
        }
        return res.json(result);
      })
      .catch((error) => {
        return res.status(404).json({
          status: "error",
          message: error,
        });
      });
  }

  findId(req, res) {
    const id = req.params.id;
    User.findById(id, (err, user) => {
      if (err) {
        return res.status(404).json({
          message: "Пользователь не найден",
        });
      }
      const info = {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        dialogs: user.dialogs,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      };
      res.json(info);
    });
  }

  delete(req, res) {
    const index = req.headers.authorization.indexOf(" ");
    const decoded = jwt.verify(
      req.headers.authorization.substring(index + 1),
      secret
    );
    const id = req.params.id;
    if (id === decoded.id) {
      User.findOneAndRemove({ _id: id })
        .then((user) => {
          if (user) {
            res.json({
              message: `Пользователь ${user.fullname} удален`,
            });
          } else {
            res.status(404).json({
              status: "error",
            });
          }
        })
        .catch((err) => {
          res.json({
            message: err,
          });
        });
    }
  }

  setAvatar(req, res) {
    const index = req.headers.authorization.indexOf(" ");
    const decoded = jwt.verify(
      req.headers.authorization.substring(index + 1),
      secret
    );
    const avatar = req.body.avatar;
    User.findById(decoded.id, (err, user) => {
      if (err || !user) {
        return res.status(404).json({
          message: "Пользователь не найден",
        });
      }
      user.avatar = avatar;
      user.save();
      res.json({ message: `Аватар изменен` });
    });
  }
}

module.exports = user;
