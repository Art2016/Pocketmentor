var mongoose = require('mongoose');

var userSchema = mongoose.Schema( {
    userid: String,
    password: String,
    name: String,
    email: String,
    gender : String,
    age : {
        type: String,
        default: ''
    },
    university: {
        type: String,
        default: ''
    },
    highSchool: {
        type: String,
        default: ''
    },
    middleSchool: {
        type: String,
        default: ''
    },
    region: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    specialty: {
        type: [String],
        default: ['?']
    },
    point: {
        type: Number,
        default: 0
    },
    mentor: {
        type: [String],
        default: []
    },
    mentee: {
        type: [String],
        default: []
    },
    favorites: {
        type: [String],
        default: []
    },
    picture: {
        type: String,
        default: '/img/profile-pic.jpg'
    },
    date: {
        type: Date,
        default: Date.now()
    },
    auth: Boolean
}, {
    versionKey: false
});

userSchema.methods.getMenteeNum = function () {
    var mentee = this.mentee;
    var str
    if (mentee.length === 1) str = (mentee == '') ? '멘티: 0명' : '멘티: 1명';
    else str = '멘티: ' + mentee.length + '명';
    return str;
};

var User = mongoose.model('User', userSchema);

module.exports = User;