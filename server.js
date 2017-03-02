// Setting up packages
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan'); // for logging
var mongoose = require('mongoose');

var jwt = require('jsonwebtoken');
var config = require('./configuration/config');
var user = require('./models/user.js');
var source = require('./models/source.js');
var expressjwt = require('express-jwt');
var auth = require('./controllers/authorizer').passport();

// Configuration
var port = process.env.PORT || 8000
mongoose.connect(config.database);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(expressjwt({ secret: config.secret}).unless({path: ['/sources','/api/register','/users','/api/authenticate']}));
app.use(auth.initialize());

var Client = require('node-rest-client').Client;

var client = new Client();

// Basic routes
app.get('/', function(req,res){
  res.json({
    message:'API is on'
  });
})

app.get('/users', function(req,res){
  user.find({}, function(error,users){
    res.json(users);
  });
});

app.get('/sources', function(req,res){
  var category = ""
  var language = ""
  if (req.query["category"]){
    category = req.query["category"]
  }

  if (req.query["language"]){
    language = req.query["language"]
  }
  var url = config.news_api.sources_endpoint+'?category='+category+'&language='+language
  client.get(url, function (data, response) {
    if (data) {
      res.json(data);
    } else {
      res.status(404).json();
    }
  });
});

app.use('/api',require('./controllers'));

// Running Server
app.listen(port, function(){
  console.log('Connected on port '+port);
});

module.exports = app;
