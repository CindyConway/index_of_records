// public modules
var compression   = require('compression');
var express       = require('express');
var bodyParser    = require('body-parser');
var path          = require('path');
var format        = require('util').format;
var fs            = require("fs");
var mongo         = require('./app/mongo.js');

var routePath  = "./app/routes/";

var app = express();
app.use(compression())
app.use(bodyParser.json());

app.all('/*', function(req, res, next) {
  // CORS headers
  res.header("Access-Control-Allow-Origin", "http://localhost"); // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // Set custom headers for CORS
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
  if (req.method == 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
});


// Auth Middleware - This will check if the token is valid
// Only the requests that start with /v1/* will be checked for the token.
// Any URL's that do not follow the below pattern should be avoided unless you
// are sure that authentication is not needed
app.all('/v1/edit/*', [require('./app/middlewares/validateRequest')]);
app.all('/v1/pub/*', [require('./app/middlewares/validateRequest')]);
app.all('/v1/admin/*', [require('./app/middlewares/validateRequest')]);

fs.readdirSync(routePath).forEach(function(file) {

    var route=routePath+file;
    require(route)(app);
});


// If no route is matched by now, it must be a 404
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

mongo.init(function (error) {
  if (error)
    console.log( error);
    app.listen(1971); //database is initialized, ready to listen for connections
});

var port = process.env.PORT || 1971;    // set our port

module.exports = app;

app.listen(port, '127.0.0.1');
console.log('Transparency happens on port ' + port + ' ' + new Date().toLocaleString());
