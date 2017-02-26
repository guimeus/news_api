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
var config = require('../../configuration/config');

router.get('/', passport.authenticate(), function(req,res){
  auth.verifyToken(req, function(result){
    if (result.success){
      var found = req.user
      User.findOne({
        _id:found.id
      }, function(err, user){
        if (err) throw err;
        if (user){
          var filter = req.query["name"]
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

router.get('/feed', passport.authenticate(), function(req,res){
  auth.verifyToken(req, function(result){
    if (result.success){
      var found = req.user
      User.findOne({
        _id:found.id
      }, function(err, user){
        if (err) throw err;
        if (user){
          var filter = req.query["name"]
          var sort = req.query["sortBy"]
          var order = req.query["order"]
          getSources(user, filter, function(sources){
            gatherArticles(sources, sort, order, function(articles){
              res.json(articles);
            })
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
    if (filter) {
      Source.find({
        _id:{
          $in : ids
        },
        name:filter
      }, function(err, sources){
        if (err) throw err;
        callBack(formatSources(user,sources));
      });
    } else {
      Source.find({
        _id:{
          $in : ids
        }
      }, function(err, sources){
        if (err) throw err;
        callBack(formatSources(user,sources));
      });
    }
  } else {
    callBack(result)
  }
}

var formatSources = function(user,sources){
  var result = []
  for(var i = 0; i<sources.length; i++){
    var _src = utils.subscribtionForID(user,sources[i])
    if (_src) {
      result.push(_src)
    }
  }
  return result
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

// ------------- NEWS_API Call --------------

var Client = require('node-rest-client').Client;

var client = new Client();

var callSource = function(source, callBack){
  var url = config.news_api.articles_endpoint+'?source='+source.name+'&apiKey='+config.news_api.key
  client.get(url, function (data, response) {
    if (data.articles){
      for (var i = 0; i < data.articles.length; i++){
        data.articles[i].source = source
      }
    }
    callBack(data);
  });
}

var isDescendingOrder = function(order) {
    if (order.toString() == "desc") {
      return true
    }
    return false
}

var gatherArticles = function(sources, sort, order, callBack) {
  var result = []
  var counter = 0
  if (sources.length > 0){
    for (var i = 0; i<sources.length; i++){
      callSource(sources[i], function(object){
        counter++
        if (object.articles) {
          appendArticles(result,object.articles)
        }
        if (counter == sources.length){
          // sort articles
          if (sort){
            if (sort.toString() == "pref") {
              // sort by weight
              result.sort(function(a, b){
                  var keyA = a.source.weight,
                      keyB = b.source.weight;
                  if (order){
                    if (isDescendingOrder(order)) {
                      if(keyA < keyB) return -1;
                      if(keyA > keyB) return 1;
                    } else {
                      if(keyA > keyB) return -1;
                      if(keyA < keyB) return 1;
                    }
                  } else { // by default desc
                    if(keyA > keyB) return -1;
                    if(keyA < keyB) return 1;
                  }
                  if (keyA == keyB) {
                    var dateA = new Date(a.publishedAt),
                        dateB = new Date(b.publishedAt);
                    if(dateA > dateB) return -1;
                    if(dateA < dateB) return 1;
                    return 0;
                  }
                  return 0;
              });
            }
          } else {
            // sort by date by default
            result.sort(function(a,b){
              var dateA = new Date(a.publishedAt),
                  dateB = new Date(b.publishedAt);
              if(dateA > dateB) return -1;
              if(dateA < dateB) return 1;
              return 0;
            })
          }
          callBack(result)
        }
      });
    }
  } else {
    callBack(result)
  }
}

var appendArticles = function(current, newArticles){
  for (var i = 0;i<newArticles.length; i++){
    current.push(newArticles[i]);
  }
}

module.exports = router;
