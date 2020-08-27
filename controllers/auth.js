const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const updateLastSeenClass = require("../utils/updateLastSeen");
const updateLastSeen = new updateLastSeenClass();
require("dotenv").config();
const secret = process.env.SECRET;
const secretRefresh = process.env.SECRET_REFRESH;

class auth {
  signup(data, socket) {
    const { email, fullname, password } = data;
    User.findOne({ email: email }).then((user) => {
      if (user) {
        socket.emit("USER:SIGNUP", {
          status: 400,
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
            socket.emit("USER:SIGNUP", { status: 500, message: err });
          }
          newUser.password = hash;
          newUser
            .save()
            .then((user) => {
              socket.emit("USER:SIGNUP", { status: 201, user });
            })
            .catch((err) =>
              socket.emit("USER:SIGNUP", { status: 500, message: err })
            );
        });
      }
    });
  }

  signin(data, socket, io) {
    const { email, password } = data;
    User.findOne({ email: email }).then((user) => {
      if (!user) {
        socket.emit("USER:SIGNIN", {
          status: 404,
          message: "Пользователь не найден.",
        });
      }
      bcrypt.compare(password, user.password).then((isMatch) => {
        if (isMatch) {
          updateLastSeen.add(user._id, socket.id);
          io.emit("SERVER:USER_ONLINE", { isOnline: true, user: user._id });
          const newRefreshToken = jwt.sign({ id: user._id }, secretRefresh, {
            expiresIn: "7d",
          });
          const token = new RefreshToken({
            user: user._id,
            refresh: newRefreshToken,
          });
          token.save();
          socket.emit("USER:SIGNIN", {
            status: 200,
            token: jwt.sign({ id: user._id }, secret, { expiresIn: 60 }),
            refreshToken: newRefreshToken,
          });
        } else {
          socket.emit("USER:SIGNIN", {
            status: 400,
            message: "Неправильный пароль.",
          });
        }
      });
    });
  }

  refresh(data, socket) {
    const { refreshToken } = data;
    try {
      const decoded = jwt.verify(refreshToken, secretRefresh);
      RefreshToken.findOne({ refresh: refreshToken })
        .then((token) => {
          const newRefreshToken = jwt.sign({ id: token.user }, secretRefresh, {
            expiresIn: "7d",
          });
          token.refresh = newRefreshToken;
          token.save();
          updateLastSeen.add(token.user, socket.id);
          socket.emit("USER:REFRESH", {
            status: 200,
            token: jwt.sign({ id: token.user }, secret, { expiresIn: 60 }),
            refreshToken: newRefreshToken,
          });
        })
        .catch(() => {
          socket.emit("USER:REFRESH", {
            status: 401,
            message: "Пользователь не найден.",
          });
        });
    } catch (error) {
      socket.emit("USER:REFRESH", {
        status: 401,
        message: error,
      });
      RefreshToken.findOneAndRemove({ refresh: refreshToken }).then(() => {});
    }
  }

  logout(data, socket, io) {
    const { token, refreshToken } = data;
    try {
      const decoded = jwt.verify(token, secret);
      RefreshToken.remove({ refresh: refreshToken })
        .then(() => {
          updateLastSeen.remove(socket);
          io.emit("SERVER:USER_ONLINE", { isOnline: false, user: decoded.id });
          socket.emit("USER:LOGOUT", {
            status: 200,
            isAuth: false,
          });
        })
        .catch((err) => {
          socket.emit("USER:LOGOUT", {
            status: 500,
            message: err,
          });
        });
    } catch (error) {
      socket.emit("USER:LOGOUT", {
        status: 401,
        message: error,
      });
    }
  }
}

module.exports = auth;
