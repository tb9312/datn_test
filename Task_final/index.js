const express = require("express");
const app = express();
require("dotenv").config();
const path = require("path");
const http = require("http");
const systemConfig = require("./v2/config/system");
const database = require("./v1/config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { Server } = require("socket.io");
const moment = require("moment");
const methodOverride = require("method-override");
const flash = require("express-flash");
const bodyParser = require("body-parser");
const session = require("express-session");

const route = require("./v1/routes/User/index.route");
const routeAdmin = require("./v2/routes/index.route");
const routeManager = require("./v1/routes/Manager/index.route");

const port = process.env.PORT;

// DB
database.connect();

// Server + Socket
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});
global._io = io;

// ===== MIDDLEWARE (THỨ TỰ CHUẨN) =====

// body
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// cookie
app.use(cookieParser());

// cors
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// static
app.use(
  "/tinymce",
  express.static(path.join(__dirname, "node_modules", "tinymce"))
);

// method override
app.use(methodOverride("_method"));

//flash
app.use(
  session({
    secret: process.env.SESSION_SECRET || "chat_task_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 giờ
    },
  })
);
app.use(flash());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

//Tinymce
app.use(
  "/tinymce",
  express.static(path.join(__dirname, "node_modules", "tinymce"))
);

app.set("views", `${__dirname}/views`);
app.set("view engine", "pug");
app.use(express.static(`${__dirname}/public`));
app.locals.moment = moment;

// locals
app.locals.moment = moment;
app.locals.prefixAdmin = systemConfig.prefixAdmin;

// routes
route(app);
routeAdmin(app);
routeManager(app);

// ✅ THÊM DÒNG NÀY VÀO ĐÂY:
require("./v1/Socket/chat.socket.js")(io); 

// start
server.listen(port, () => {
  console.log(`App listening on port ${port}`);
});