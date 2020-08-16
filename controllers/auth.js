const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const updateLastSeenClass = require("../utils/updateLastSeen");
require("dotenv").config();
const secret = process.env.SECRET;
const secretRefresh = process.env.SECRET_REFRESH;

const updateLastSeen = new updateLastSeenClass();

class auth {
  constructor(io) {
    this.io = io;
  }

  issueTokenPair(userId) {
    const newRefreshToken = jwt.sign({ id: userId }, secretRefresh, {
      expiresIn: "7d",
    });
    const token = new RefreshToken({
      user: userId,
      refresh: newRefreshToken,
    });
    token.save();
    return {
      status: "success",
      token: jwt.sign({ id: userId }, secret, { expiresIn: 60 }),
      refreshToken: newRefreshToken,
    };
  }

  signup(req, res) {
    const { email, password, fullname } = req.body;
    User.findOne({ email: email }).then((user) => {
      if (user) {
        return res.status(400).json({
          message: "Пользователь существует.",
        });
      } else {
        const newUser = new User({
          email: email,
          password: password,
          fullname: fullname,
        });
        bcrypt.hash(newUser.password, 10, (err, hash) => {
          if (err) {
            res.status(500).json({
              message: err,
            });
          }
          newUser.password = hash;
          newUser
            .save()
            .then((user) => {
              res.status(201).json(user);
            })
            .catch((err) =>
              res.status(500).json({
                message: err,
              })
            );
        });
      }
    });
  }

  signin(req, res) {
    const index = req.headers.cookie.indexOf("=");
    const socket = req.headers.cookie.substring(index + 1);
    const { email, password } = req.body;
    User.findOne({ email: email }).then((user) => {
      if (!user) {
        return res.status(404).json({
          message: "Пользователь не найден.",
        });
      }
      bcrypt.compare(password, user.password).then((isMatch) => {
        if (isMatch) {
          updateLastSeen.add(user._id, socket);
          this.io.emit("SERVER:USER_ONLINE");
          res.status(200).json(this.issueTokenPair(user._id));
        } else {
          res.status(400).json({ message: "Неправильный пароль." });
        }
      });
    });
  }

  refresh(req, res) {
    const index = req.headers.cookie.indexOf("=");
    const socket = req.headers.cookie.substring(index + 1);
    const { refreshToken } = req.body;
    RefreshToken.findOne({ refresh: refreshToken })
      .then((token) => {
        updateLastSeen.add(token.user, socket);
        token.remove();
        this.io.emit("SERVER:USER_ONLINE");
        res.status(200).json(this.issueTokenPair(token.user));
      })
      .catch(() => {
        res.status(404).json({ message: "Пользователь не найден." });
      });
  }

  logout(req, res) {
    const index = req.headers.cookie.indexOf("=");
    const socket = req.headers.cookie.substring(index + 1);
    const { refreshToken } = req.body;
    RefreshToken.remove({ refresh: refreshToken })
      .then(() => {
        updateLastSeen.remove(socket);
        this.io.emit("SERVER:USER_ONLINE");
        res.status(200).json({
          isAuth: false,
        });
      })
      .catch((err) => {
        res.status(500).json({
          message: err,
        });
      });
  }
}

module.exports = auth;
