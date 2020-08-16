const app = require("express")();
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const http = require("http").createServer(app);
const io = require("./utils/socket")(http);
const passport = require("passport");
const db = require("./db");
const multer = require("./multer");
require("dotenv").config();

db.connect();

app.use(passport.initialize());
require("./utils/passport-config")(passport);

app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const authClass = require("./controllers/auth");
const auth = new authClass(io);

app.post("/user/signup", (req, res) => {
  auth.signup(req, res);
});
app.post("/user/signin", (req, res) => {
  auth.signin(req, res);
});
app.post("/user/refresh", (req, res) => {
  auth.refresh(req, res);
});
app.post(
  "/user/logout",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    auth.logout(req, res);
  }
);

const userClass = require("./controllers/user");
const user = new userClass(io);

app.get(
  "/user/me",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    user.get(req, res);
  }
);
app.get(
  "/user/find",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    user.find(req, res);
  }
);

app.get(
  "/user/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    user.findId(req, res);
  }
);
app.delete(
  "/user/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    user.delete(req, res);
  }
);

const dialogsClass = require("./controllers/dialogs");
const dialogs = new dialogsClass(io);

app.get(
  "/dialogs",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    dialogs.get(req, res);
  }
);
app.post(
  "/dialogs",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    dialogs.create(req, res);
  }
);
app.delete(
  "/dialogs/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    dialogs.delete(req, res);
  }
);

const messagesClass = require("./controllers/messages");
const messages = new messagesClass(io);

app.get(
  "/messages",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    messages.get(req, res);
  }
);
app.post(
  "/messages",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    messages.create(req, res);
  }
);
app.delete(
  "/messages",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    messages.delete(req, res);
  }
);

const uploadClass = require("./controllers/upload");
const upload = new uploadClass(io);

app.post("/files", multer.single("file"), (req, res) => {
  upload.create(req, res);
});
app.delete("/files", (req, res) => {
  upload.delete(req, res);
});

http.listen(process.env.PORT, () => {
  console.log(`Server run: ${process.env.PORT}`);
});
