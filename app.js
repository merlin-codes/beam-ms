const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config();

// include controllers form routes
const indexRouter = require('./routes/index');
const studentRouter = require('./routes/student');

const app = express();

// setuping
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
const connection = mysql.createConnection({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PS,
	database : process.env.DB_NAME
});

// middleware
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// routes shower
app.use('/', indexRouter);
app.use('/student', studentRouter);
app.post("/auth", (req, res) => {
  if(req.session.loggedin){
    res.redirect("/school");
    return;
  }
  let username = req.body.uid;
  let password = req.body.pwd;
  if (username && password) {
    connection.query(
      'SELECT * FROM users WHERE email = ? AND pwd = ?',
      [username, password], (error, result, fields) => {
      if(result.length > 0){
        req.session.loggedin = true;
        req.session.usernam = username;
        console.log(result);
        res.redirect("/");
      }else{
        res.send("incorrect username of password");
      }
      return;
    });
  }else {
    res.send("Password or username is empty");
  }
  return;
})

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});
// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
