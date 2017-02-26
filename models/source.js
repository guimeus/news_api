var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// Setting mongoose model
module.exports = mongoose.model('Source', new Schema({
  name:String,
  subscribers:[{userId:Schema.Types.ObjectId}]
}));
