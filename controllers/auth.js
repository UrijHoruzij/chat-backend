const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const passport = require("passport");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.SECRET;
const secretRefresh = process.env.SECRET_REFRESH;

router.post("/signup", (req, res) => {
  User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      let error = "Email Address Exists in Database.";
      return res.status(400).json(error);
    } else {
      const newUser = new User({
        email: req.body.email,
        password: req.body.password,
        fullname: {
          name: req.body.fullname.name,
          surname: req.body.fullname.surname,
        },
      });
      bcrypt.genSalt(10, (err, salt) => {
        if (err) throw err;
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then((user) => {
              res.json(user);
            })
            .catch((err) => res.status(400).json(err));
        });
      });
    }
  });
});

router.post("/signin", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email }).then((user) => {
    if (!user) {
      errors.email = "No Account Found";
      return res.status(404).json(errors);
    }
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        const payload = {
          id: user._id,
          fullname: {
            name: user.name,
            surname: user.surname,
          },
        };
        const refresh = jwt.sign({ id: user._id }, secretRefresh, {
          expiresIn: "30d",
        });
        jwt.sign(payload, secret, { expiresIn: 60 }, (err, token) => {
          if (err) {
            res.status(500).json({ error: "Error signing token", raw: err });
          }
          User.findByIdAndUpdate(
            user._id,
            {
              refreshToken: {
                token: refresh,
                fingerprint: req.fingerprint,
              },
            },
            (err) => {
              if (err) {
                res
                  .status(500)
                  .json({ error: "Error signing token", raw: err });
              }
            }
          ).then(() => {
            res.json({
              success: true,
              token: token,
              refresh: refresh,
            });
          });
        });
      } else {
        errors.password = "Password is incorrect";
        res.status(400).json(errors);
      }
    });
  });
});

router.post("/update-token", (req, res) => {
  const id = req.body.id;
  const fingerprint = req.fingerprint;
  const refresh = req.body.refresh;
  User.findById(id).then((user) => {
    if (
      user.refreshToken.token === refresh &&
      user.refreshToken.fingerprint.hash === fingerprint.hash
    ) {
      const payload = {
        id: user._id,
        fullname: {
          name: user.name,
          surname: user.surname,
        },
      };
      jwt.sign(payload, secret, { expiresIn: 3600 }, (err, token) => {
        if (err) {
          res.status(500).json({ error: "Error signing token", raw: err });
        }
        res.json({
          success: true,
          token: token,
        });
      });
    } else {
      res.status(500).json({ error: "Error update token" });
    }
  });
});

module.exports = router;
