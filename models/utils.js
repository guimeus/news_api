exports.hasSubscribedToSource = function(user, source){
  var sourceId = source._id
  var i = 0
  if (user.subs){
    while(i < user.subs.length){
      var _srce = user.subs[i]
      if (_srce.sourceId.toString() == sourceId.toString()) {
        console.log(user._id+" is subscribed to source "+sourceId);
        return true
      } else {
        i++
      }
    }
    console.log(user._id+" is not subscribed to source "+sourceId);
    return false
  } else {
    console.log(user._id+" is not subscribed to source "+sourceId);
    return false
  }
}

exports.hasSubscriber = function(user, source) {
  var userId = user._id
  var i = 0
  if (source.subcribers){
    while(i < source.subcribers.length){
      var _userId = source.subcribers[i]
      if (_userId.toString() == userId.toString()) {
        console.log(source._id+" has subscriber "+userId);
        return true
      } else {
        i++
      }
    }
    console.log(source._id+" doesnt has subscriber "+userId);
    return false
  } else {
    console.log(source._id+" doesnt has subscriber "+userId);
    return false
  }
}
