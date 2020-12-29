const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mysql = require('mysql');
const session = require('express-session');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// setuping
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// middleware
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use('/logo-beamMS.svg', express.static('images/logo-beamMS.svg'));

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// routes shower
app.use('/', require('./routes/index'));
// app.use('/root', require('./routes/root'));
app.use('/teacher', require('./routes/teacher'));
app.use('/student', require('./routes/student'));

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
