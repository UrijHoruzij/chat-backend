const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.SECRET;
const secretRefresh = process.env.SECRET_REFRESH;

class user {
  getMe(data, socket) {
    const { token } = data;
    try {
      const decoded = jwt.verify(token, secret);
      User.findById(decoded.id, (err, user) => {
        if (err || !user) {
          return socket.emit("USER:GET_ME", {
            status: 404,
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
        socket.emit("USER:GET_ME", {
          status: 200,
          me,
        });
      });
    } catch (error) {
      socket.emit("USER:GET_ME", {
        status: 401,
        message: error,
      });
    }
  }

  find(data, socket) {
    const { email, token } = data;
    try {
      const decoded = jwt.verify(token, secret);
      User.find({ email: new RegExp(email, "i") })
        .then((users) => {
          let result = [];
          for (let user in users) {
            let info = {
              _id: users[user]._id,
              fullname: users[user].fullname,
              email: users[user].email,
              avatar: users[user].avatar,
              isOnline: users[user].isOnline,
              lastSeen: users[user].lastSeen,
            };
            result[`${user}`] = info;
          }
          return socket.emit("USER:FIND", {
            status: 200,
            result,
          });
        })
        .catch(() => {
          socket.emit("USER:FIND", {
            status: 404,
            message: "Пользователь не найден",
          });
        });
    } catch (error) {
      socket.emit("USER:FIND", {
        status: 401,
        message: error,
      });
    }
  }

  findId(data, socket) {
    const { id, token } = data;
    try {
      const decoded = jwt.verify(token, secret);
      User.findById(id, (err, user) => {
        if (err) {
          return socket.emit("USER:FIND_ID", {
            status: 404,
            message: "Пользователь не найден",
          });
        }
        const info = {
          _id: user._id,
          fullname: user.fullname,
          email: user.email,
          avatar: user.avatar,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen,
        };
        socket.emit("USER:FIND_ID", {
          status: 404,
          info,
        });
      });
    } catch (error) {
      socket.emit("USER:FIND_ID", {
        status: 401,
        message: error,
      });
    }
  }

  delete(data, socket) {
    const { id, token, refreshToken } = data;
    try {
      const decoded = jwt.verify(token, secret);
      const refreshDecoded = jwt.verify(refreshToken, secretRefresh);
      if (id === decoded.id) {
        User.findOneAndRemove({ _id: id })
          .then((user) => {
            socket.emit("USER:DELETE", {
              status: 200,
              message: `Пользователь ${user.fullname} удален`,
            });
          })
          .catch(() => {
            socket.emit("USER:DELETE", {
              status: 404,
              message: "Пользователь не найден",
            });
          });
      }
    } catch (error) {
      socket.emit("USER:DELETE", {
        status: 401,
        message: error,
      });
    }
  }

  setAvatar(data, socket) {
    const { token, avatar } = data;
    try {
      const decoded = jwt.verify(token, secret);
      User.findById(decoded.id, (err, user) => {
        if (err || !user) {
          return socket.emit("USER:SET_AVATAR", {
            status: 404,
            message: "Пользователь не найден",
          });
        }
        user.avatar = avatar;
        user.save();
        socket.emit("USER:SET_AVATAR", {
          status: 200,
          message: "Аватар изменен",
        });
      });
    } catch (error) {
      socket.emit("USER:SET_AVATAR", {
        status: 401,
        message: error,
      });
    }
  }

  setFullname(data, socket) {
    const { token, fullname } = data;
    try {
      const decoded = jwt.verify(token, secret);
      User.findById(decoded.id, (err, user) => {
        if (err || !user) {
          return socket.emit("USER:SET_FULLNAME", {
            status: 404,
            message: "Пользователь не найден",
          });
        }
        user.fullname = fullname;
        user.save();
        socket.emit("USER:SET_FULLNAME", {
          status: 200,
          message: "Имя изменено",
        });
      });
    } catch (error) {
      socket.emit("USER:SET_FULLNAME", {
        status: 401,
        message: error,
      });
    }
  }
}

module.exports = user;
