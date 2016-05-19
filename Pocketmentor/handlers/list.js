var User = require('../models/user.js');

exports.view = function (req, res) {
    User.find({ userid: { $in: req.user.favorites } }, function (err, users) {
        if (err) return res.status(500).send('error: Internal error.');
        if (!users.length) return res.render('list', { notresult: '검색결과가 없습니다.' });
        
        var favoriteUser = users.map(function (user) {
            return {
                userid: user.userid,
                name: user.name,
                picture: user.picture,
                specialty: user.specialty,
            };
        });
        res.render('list', { favoriteUser: favoriteUser });
    });
}

exports.myMentor = function (req, res) {
    res.render('list/make-my-mentor');
}

exports.myMentee = function (req, res) {
    res.render('list/make-my-mentee');
}

exports.mentorSuggestions = function (req, res) {
    res.render('list/make-mentor-suggestions');
}

exports.mentorInterest = function (req, res) {
    res.render('list/make-mentor-interest');
}