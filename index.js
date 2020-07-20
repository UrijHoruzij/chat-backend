const app = require("express")();
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const http = require("http").createServer(app);
require("./utils/socket")(http);
const passport = require("passport");
const db = require("./db");
var fingerprint = require("express-fingerprint");
require("dotenv").config();

db.connect();

app.use(passport.initialize());
require("./utils/passport-config")(passport);

app.use(cors());
app.use(fingerprint());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/user", require("./controllers/auth"));

app.use(
  "/user",
  passport.authenticate("jwt", { session: false }),
  require("./controllers/user")
);

app.use(
  "/dialogs",
  passport.authenticate("jwt", { session: false }),
  require("./controllers/dialogs")
);

app.use(
  "/messages",
  passport.authenticate("jwt", { session: false }),
  require("./controllers/messages")
);

http.listen(process.env.PORT, () => {
  console.log(`Server run: ${process.env.PORT}`);
});
