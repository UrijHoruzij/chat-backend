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

// app.get("/user/me", (req, res) => {});
// app.post("/user/signin", (req, res) => {});
// app.post("/user/signup");
// app.get("/user/find", (req, res) => {});
// app.get("/user/:id", (req, res) => {});
// app.delete("/user/:id", (req, res) => {});

app.get("/dialogs", (req, res) => {});
app.post("/dialogs", (req, res) => {});
app.delete("/dialogs/:id", (req, res) => {});

app.get("/messages", (req, res) => {});
app.post("/messages", (req, res) => {});
app.delete("/messages", (req, res) => {});

//add room
app.post("/dialog", (req, res) => {
  if (req.body) {
    const { userId1, userId2 } = req.body;
    let flagFind = false;
    do {
      let roomId = uuidv4();
      Room.find({ roomId: roomId }, (err, docs) => {
        if (err) {
          const room = new Room({
            roomId: roomId,
            users: [userId1, userId2],
            messages: [],
          });
          room.save();
          console.log("Комната добавлена", roomId);
          flagFind = false;
        } else {
          flagFind = true;
        }
      });
    } while (flagFind);
  } else {
    res.status(500);
  }
});
//joined room
app.post("/joinedroom", (req, res) => {
  if (req.body) {
    const { userId, roomId } = req.body;
  } else {
    res.status(500);
  }
});

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
