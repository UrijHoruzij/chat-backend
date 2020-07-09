const { Strategy, ExtractJwt } = require("passport-jwt");
require("dotenv").config();
const mongoose = require("mongoose");
const passport = require("passport");
const User = require("./models/User");

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SECRET,
};

module.exports = (passport) => {
  passport.use(
    new Strategy(opts, (payload, done) => {
      User.findById(payload.id)
        .then((user) => {
          if (user) {
            return done(null, {
              id: user.id,
              fullname: {
                name: user.name,
                surname: user.surname,
              },
            });
          }
          return done(null, false);
        })
        .catch((err) => console.error(err));
    })
  );
};
