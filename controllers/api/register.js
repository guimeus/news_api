var express = require('express');
var router = express.Router();
var fSystem = require('fs');
var util = require('util');
var log_file = fSystem.createWriteStream('./debug.log', {flags : 'w'});
var log_stdout = process.stdout;

var User = require('../../models/user');
var crypto = require('crypto');
var log = require('../logHelper');
var config = require('../../configuration/config');

console.log = function(d) {
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

router.post('/', function(req,res){
  if (!verifyAPIKey(req.body.apikey)) {
    log.logError(req,503,'RegisterUserAPI');
    res.status(403).json({
      errorType:'InvalidAPIKey',
      errorMessage:'The API key provided is incorrect.'
    });
    return
  }
  User.findOne({
    username_lower:req.body.username.toLowerCase()
  }, function(error,user){
    if (error) throw error;
    if (user) {
      log.logError(req,403,'RegisterUserAPI');
      res.status(403).json({
        errorType:'usernameUsed',
        errorMessage:'The username provided is used by another user'
      });
    } else {
      // evaluatePassword
      if (evaluatePassword(req.body.password)) {
        var newUser = new User({
          username:req.body.username,
          username_lower:req.body.username.toLowerCase(),
          password:crypto.createHash('md5').update(req.body.password).digest('hex')
        });
        newUser.save(function(error) {
          if (error) throw error;
          logSuccess();
          res.status(200).json();
        });
      } else {
        log.logError(req,403,'RegisterUserAPI');
        res.status(403).json({
          errorType:'InvalidPassword',
          errorMessage:'Password length must be between 6 and 20 characters and contains at least one numeric diigit, one uppercase, and one lowercase letter'
        });
      }
    }
  });
});

var evaluatePassword = function(pass) {
  var regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
  if (pass.match(regex)) {
    return true;
  } else {
    return false;
  }
}

var logSuccess = function(req) {
  console.log("------------------------RegisterUserAPI-----------------------");
  console.log("----------------------"+new Date()+"----------------------");
  console.log('statusCode : 200');
  console.log('User registered Successfully');
  console.log("------------------------------------------------------");
}

var verifyAPIKey = function(key) {
  if (!key) {
    return false;
  }
  return key == config.apikey;
}

module.exports = router;
