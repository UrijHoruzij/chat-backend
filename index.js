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
