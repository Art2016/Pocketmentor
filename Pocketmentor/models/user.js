var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    userid: String,
    password: String,
    name: String,
    email: String,
    gender : String,
    age : Number,
    university: String,
    highSchool: String,
    middleSchool: String,
    address: String,
    specialty: [String],
    point: Number,
    mento: [String],
    picture: String,
    date: Date
});

var User = mongoose.model('User', userSchema);

module.exports = User;