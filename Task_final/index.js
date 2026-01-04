const express = require("express");
const app = express();
require("dotenv").config();
const path = require("path");
const http = require("http");
const systemConfig = require("./v2/config/system");
const database = require("./v1/config/database");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const flash = require("express-flash");
const session = require("express-session");
const { Server } = require("socket.io");
const moment = require("moment");

const route = require("./v1/routes/User/index.route");
const routeAdmin = require("./v2/routes/index.route");
const routeManager = require("./v1/routes/Manager/index.route");

const port = process.env.PORT;
database.connect();
//cors
const cors = require("cors");

//socketIO
const server = http.createServer(app);
const io = new Server(server);
// io.on("connection", (socket) => {
//   console.log("a user connected", socket.id);
// });
global._io = io;
//end SocketIO

//flash
app.use(cookieParser("keyboard cat"));
app.use(session({ cookie: { maxAge: 60000 } }));
app.use(flash());
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
// methodOverride
//Tinymce
app.use(
  "/tinymce",
  express.static(path.join(__dirname, "node_modules", "tinymce"))
);
//End Tinymce
const methodOverride = require("method-override");
app.use(methodOverride("_method"));

app.set("views", `${__dirname}/views`);
app.set("view engine", "pug");
//cors
app.use(cors());

app.use(express.static(`${__dirname}/public`));
app.locals.moment = moment;
// App locals Variables
app.locals.prefixAdmin = systemConfig.prefixAdmin;

route(app);
routeAdmin(app);
routeManager(app);
// app.get("*", (req, res) => {
//   res.render("errors/404", {
//     pageTitle: "404 Not Found",
//   });
// });

// app.listen(port, () => {
//   console.log(`App listening on port ${port}`);
// });
server.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
