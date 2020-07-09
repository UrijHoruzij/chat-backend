const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const passport = require("passport");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.SECRET;

router.get("/me", (req, res) => {
  const decoded = jwt.verify(req.body.token, secret);
  const me = {
    id: decoded.id,
    fullname: decoded.fullname,
    timeToken: decoded.exp,
  };
  res.json(me);
});

module.exports = router;
