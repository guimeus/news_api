var express = require('express');
var router = express.Router();
var fSystem = require('fs');
var util = require('util');
var log_file = fSystem.createWriteStream('./debug.log', {flags : 'w'});
var log_stdout = process.stdout;

var jwt = require('jsonwebtoken');
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
    log.logError(req,503,'AuthenticateUserAPI');
    res.status(503).json({
      errorType:'InvalidAPIKey',
      errorMessage:'The API key provided is incorrect.'
    });
    return
  }
  User.findOne({
    username_lower:req.body.username.toLowerCase()
  }, function(error, user){
    if (error) throw error;
    if (!user) {
      // user not found
      log.logError(req,404,'AuthenticateUserAPI');
      res.status(404).json({
        errorType:'userNotFound',
        errorMessage:'Authentication failed. User not found.'
      });
    } else {
      // Password check
      var hashedPass = crypto.createHash('md5').update(req.body.password).digest('hex');
      if (user.password != hashedPass){
        log.logError(req,401,'AuthenticateUserAPI');
        res.status(401).json({
          errorType:'IncorrectPassword',
          errorMessage:'Password provided is incorrect.'
        });
      } else {
        // Generate Token
        var expiration = '24h'
        var token = jwt.sign({id:user._id}, config.secret, { expiresIn: expiration});
        res.status(200).json({
          expiresIn:expiration, // seconds
          token:token
        });
      }
    }
  });
});

var logSuccess = function(req) {
  console.log("------------------------AuthenticateUserAPI-----------------------");
  console.log("----------------------"+new Date()+"----------------------");
  console.log('statusCode : 200');
  console.log('User Authenticated Successfully');
  console.log("------------------------------------------------------");
}

var verifyAPIKey = function(key) {
  if (!key) {
    return false;
  }
  return key == config.apikey;
}

module.exports = router;
