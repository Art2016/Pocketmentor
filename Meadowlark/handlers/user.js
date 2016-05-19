var User = require('../models/user.js');

exports.home = function (req, res) {
    User.find(function (err, users) {
        if (err) return console.log(err);
        if (users.length) return;
        
        new User({
            username : 'test1',
            email : 'test1@test.com',
            fullname : 'Bob Smith',
            age : 27,
            location : 'San Francisco',
            gender : 'Male'
        }).save();
    });
    res.render('user-rest');
}
exports.read = function (req, res) {
    if (req.params.id === 'all') {
        User.find(function (err, users) {
            if (err) return res.status(500).send('error: Internal error.');
            var list = {
                users: users.map(function (user) {
                    return {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                    };
                })
            };
            res.json(list);
        });
    }
    else {
        User.findById(req.params.id, function (err, user) {
            if (err) return res.status(500).send('error: Unable to retrieve user.');
            res.json({
                fullname: user.fullname,
                age: user.age,
                gender: user.gender,
                location: user.location
            });
        });
    }
}
exports.create = function (req, res) {
    var user = new User({
        username: req.body.username,
        email: req.body.email,
        fullname: req.body.fullname,
        age: req.body.age,
        location: req.body.location,
        gender: req.body.gender
    });
    user.save(function (err, user) {
        //if (err) return res.status(500).send('error: Unable to add user.');
        res.json(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
}
exports.delete = function (req, res) {
    User.findByIdAndRemove(req.params.id, function (err) {
        res.json(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
}