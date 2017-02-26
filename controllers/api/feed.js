var express = require('express');
var router = express.Router();
var fSystem = require('fs');
var util = require('util');
var log_file = fSystem.createWriteStream('./debug.log', {flags : 'w'});
var log_stdout = process.stdout;

var jwt = require('jsonwebtoken');
var User = require('../../models/user');
var Source = require('../../models/source');
var log = require('../logHelper');
var auth = require('../authorizer')
var passport = auth.passport();

router.get('/', passport.authenticate(), function(req,res){
  auth.verifyToken(req, function(result){
    if (result.success){
      var found = req.user
      User.findOne({
        _id:found.id
      }, function(err, user){
        if (err) throw err;
        if (user){
          var filter = req.query["source"]
          getSources(user, filter, function(sources){
            res.json(sources);
          });
        } else {
          log.logError(req,404,'SubscribeAPI');
          res.status(404).json({
            errorType:'userNotFound',
            errorMessage:'User not found.'
          });
        }
      });
    } else {
      var msg = "Invalid token provided."
      if (result.error){
        msg = authResult.error
      }
      res.status(401).json({
        errorType:'AuthorizationError',
        errorMessage:msg
      });
    }
  });
});

var getSources = function(user, filter, callBack){
  var result = []
  var counter
  var _result = getSourcesId(user);
  var sources = _result.sources
  var ids = _result.ids

  if (ids.length > 0){
    console.log(filter);
    if (filter) {
      Source.find({
        _id:{
          $in : ids
        },
        name:filter
      }, function(err, sources){
        if (err) throw err;
        callBack(sources);
      });
    } else {
      Source.find({
        _id:{
          $in : ids
        }
      }, function(err, sources){
        if (err) throw err;
        callBack(sources);
      });
    }
  } else {
    callBack(result)
  }
}

var getSourcesId = function(user){
  var result = []
  var ids = []
  if (user.subs){
    for(var i = 0; i < user.subs.length; i++){
      result.push(user.subs[i])
      ids.push(user.subs[i].sourceId)
    }
    return {sources:result, ids:ids}
  } else {
    return {sources:result, ids:ids}
  }
}

module.exports = router;
