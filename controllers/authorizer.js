var jwt = require('jsonwebtoken');
var config = require('../configuration/config');
var passport = require('passport');
var passportBearer = require('passport-http-jwt-bearer');
var Strategy = passportBearer.Strategy;
var User = require('../models/user');


var params = {
  secretOrKey:config.secret
};

exports.passport = function() {
  // Middleware executed on application starts
  // payload is the payload intially created via jwt and decoded with the secretkey and contains the id of the user
  // the payload containing the user id will help fetch the user in the database
    var strategy = new Strategy(params.secretOrKey, function(payload, done) {
        User.find({
          _id:payload._id
        }, function(error,user){
          if (error) throw error;
          if (user) {
              return done(null, {
                  id: user._id
              });
          } else {
              return done(new Error("User not found"), null);
          }
        });

    });
    passport.use(strategy); // injecting Middleware
    return {
        initialize: function() {
            return passport.initialize(); // starts the passport
        },
        authenticate: function() {
            return passport.authenticate("jwt-bearer", {session: false}); // authenticates access to route
        }
    };
};

exports.verifyToken = function(req, callBack){
    var extractToken = function(req){
      if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
        return req.headers.authorization.split(' ')[1];
      } else if (req.query && req.query.token) {
        return req.query.token;
      } else {
        return null;
      }
    }

    var token = extractToken(req);
    if (token) {
      jwt.verify(token, config.secret, function(err, decoded) {
      if (err) {
        return callBack({success:false, error:err});
      } else {
        req.user = decoded;
        return callBack({success:true, error:null});
      }
    });
    } else {
      return callBack({success:false, error:"No token provided."});
    }
}
