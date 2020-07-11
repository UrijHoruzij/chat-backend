const app = require("express")();
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const passport = require("passport");
const db = require("./db");
var fingerprint = require("express-fingerprint");
require("dotenv").config();

db.connect();

app.use(passport.initialize());
require("./passport-config")(passport);

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

io.on("connection", (socket) => {
  console.log(`a user connected ${socket.id}`);

  socket.on("joined", () => {});

  socket.on("message", (msg) => {
    console.log(msg);
  });

  socket.on("disconnect", () => {
    console.log(`user disconnected ${socket.id}`);
  });
});

http.listen(process.env.PORT, () => {
  console.log(`Server run: ${process.env.PORT}`);
});
