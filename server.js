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

//Uncomment for x-www-form-urlencoded posts/puts
//app.use(bodyParser.urlencoded({ extended: false }));

//Added to allow cross-domain request from the UI
app.use(function(req,res, next){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,HEAD,DELETE,OPTIONS');
    return next();
})

fs.readdirSync(routePath).forEach(function(file) {
    var route=routePath+file;
    require(route)(app);
});

mongo.init(function (error) {
  if (error)
    console.log( error);

  app.listen(ADD_PORT); //database is initialized, ready to listen for connections
});

var port = process.env.PORT || ADD_PORT;    // set our port

module.exports = app;

app.listen(port);
console.log('Transparency happens on port ' + port + ' ' + new Date().toLocaleString());
