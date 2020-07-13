var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const mongoose = require("mongoose"); // add mongoose
const bodyParser = require("body-parser"); // add body parser
const passport = require("passport"); // add passport

const usersApiRouter = require("./routes/api"); // add users api
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();

// ----------------- start setup

// add cors exception
var cors = require("cors");
app.use(cors());

// add body parser middleware to extract all item
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());

// config mongo
const db = require("./config/keys").mongoUrl;
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("mongo connected"))
  .catch((err) => console.log(err));

// config passport
app.use(passport.initialize());
require("./config/passport")(passport);

// ----------------- end setup

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/api/v1/users", usersApiRouter); // setup users api

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
