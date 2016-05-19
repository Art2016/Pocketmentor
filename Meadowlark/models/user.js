var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    username : String,
    email : String,
    fullname : String,
    age : Number,
    location : String,
    gender : String
});

var User = mongoose.model('User', userSchema);

module.exports = User;