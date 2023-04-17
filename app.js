
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fileupload = require('express-fileupload')
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var db = require('./config/connection')
var hbs = require('express-handlebars')
var app = express();
var session = require('express-session')

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs','html');
//app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout',layoutDir:__dirname+'/views/layout/',partialsDir:__dirname+'/view/partials/'}))
app.use(session({ secret: "key", cookie: { maxAge: 1500000 }}))

app.use(express.static(path.join(__dirname, 'public')))



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileupload())
// database connection
db.connect((err) => {
  if (err) console.log('connection error' + err)
  else console.log('database conected')
})


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use(express.static('public'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

