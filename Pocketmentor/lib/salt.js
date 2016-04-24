var crypto = require('crypto');

exports.tocken = function () {
    var tocken = Math.round((new Date().valueOf() * Math.random())) + "";
    
    return tocken;
};

exports.password = function (pw) {
    var password = crypto.createHash('sha256').update(pw).digest('hex');
    
    return password;
};