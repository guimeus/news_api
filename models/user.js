var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// Setting mongoose model
module.exports = mongoose.model('User', new Schema({
  username:String,
  username_lower:String,
  password:String,
  subs:[
    {
      sourceWeight:Number,
      sourceId:Schema.Types.ObjectId
  }
]
}));
