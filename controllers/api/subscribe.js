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
var utils = require('../../models/utils');

console.log = function(d) {
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

router.put('/', passport.authenticate() ,function(req,res){
  auth.verifyToken(req, function(result){
    if (result.success){
      var found = req.user
      User.findOne({
        _id:found.id
      }, function(err, user){
        if (err) throw err;
        if (user) {
          var sources = req.body.sources
          if (sources) {
            if (sources.length > 0) {
              updateUser(user, sources, res);
            } else {
              res.status(200).json();
            }
          } else {
            log.logError(req,404,'SubscribeAPI');
            res.status(404).json({
              errorType:'InvalidRequest',
              errorMessage:'No sources provided.'
            });
          }
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

var updateUser = function(user,subs,res){
    iterateOverSources(user,subs, function(success){
      if (success){
        res.json();
      } else {
        res.status(404).json({
          errorType:'BadRequest',
          errorMessage:'sources wrong format'
        });
      }
    });
}

var iterateOverSources = function(user, subs, callBack){
  var counter = 0
  for (var i=0; i<subs.length; i++){
    console.log("adding "+ subs[i]);
    // checking body format
    if (subs[i].name && subs[i].weight) {
      performChanges(user,subs[i], function(){
        counter++
        if (counter == subs.length) {
          callBack(true);
        }
      });
    } else {
      callBack(false); //error wrong format
      break;
    }
  }
};

var performChanges= function(user, _source, success){
    Source.findOne({
      name:_source.name.toLowerCase()
    }, function(error, source){
        if (error) throw error;
        if (source){
          console.log("source found")
          var update = false
          // updating subscribers
          if (source.subscribers){
            subscribeToSource(user, _source.weight, source, function(updated){
              if (updated) { // user updated -> updating souce
                console.log("user update , updating source");
                source.subscribers.push({userId:user._id})
                console.log(source);
                source.save(function(err){
                  if (err) throw err;
                  success()
                })
              } else { // user not updated because already subscribed
                console.log("user not updated because already subscribed");
                success()
              }
            })
          } else {
            console.log("adding subscriber");
            source.subscribers = [{userId:user._id}]
            console.log(source);
            source.save(function(err){
              if (err) throw err;
              subscribeToSource(user, _source.weight, source, function(updated){
                success()
              })
            });
          }

        } else {
          console.log("creating source");
          // creating new source if not exist
          var newSource = new Source({
            name:_source.name.toLowerCase(),
            subscribers: [{userId:user._id}]
          });
          newSource.subscribers = [{userId:user._id}]
          console.log(newSource);
          newSource.save(function(error){
            if (error) throw error;
            subscribeToSource(user, _source.weight, newSource, function(updated){
              success()
            })
          });
        }
    });
};

Array.prototype.unique = function() {
    var a = this.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
};

var subscribeToSource = function(user, sourceWeight, source, callBack){
  if (user.subs){
    if (!utils.hasSubscribedToSource(user, source)){
      user.subs.push({
        sourceWeight:sourceWeight,
        sourceId:source._id
      });
      user.save(function(err){
        if (err) throw err;
        console.log("subscrtion ok");
        callBack(true)
      });
    } else {
      console.log("source already exists");
      callBack(false)
    }
  } else {
    user.subs = [{
      sourceWeight:sourceWeight,
      sourceId:source._id
    }]
    user.save(function(err){
      if (err) throw err;
      callBack(true)
    });
  }
}

module.exports = router;
