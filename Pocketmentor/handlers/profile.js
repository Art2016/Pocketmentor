var request = require('request');

var User = require('../models/user.js');

exports.view = function (req, res){
	res.render('profile-about');
};

exports.modify = function (req, res) {
    switch (req.params.save) {
        case 'picture':
            User.findByIdAndUpdate(req.user._id, { picture: req.body.path }, function (err, user) {
                if (err) console.log(err);
                res.json(
                    (err === null) ? { msg: 'success' } : { msg: 'fail' }
                );
            });
            break;
        case 'basic':
            User.findByIdAndUpdate(req.user._id, { name: req.body.name, gender: req.body.gender, age: req.body.age }, function (err, user) {
                if (err) console.log(err);
                res.json(
                    (err === null) ? { msg: 'success' } : { msg: 'fail' }
                );
            });
            break;
        case 'contact':
            User.findByIdAndUpdate(req.user._id, {
                region: req.body.region, city: req.body.city, middleSchool: req.body.middleSchool, highSchool: req.body.highSchool, university: req.body.university, specialty: req.body.specialty
            }, function (err, user) {
                if (err) console.log(err);
                res.json(
                    (err === null) ? { msg: 'success' } : { msg: 'fail' }
                );
            });
            break;
        default: res.json({ msg: 'fail' });
    }
}

exports.cityCategory = function (req, res) {
    var cities = '';
    switch (req.params.cityName) {
        case '서울':
            cities = ['강남구', '강동구', '강북구', '강서구', '관악구'];
            break;
        case '경기':
            cities = ['수원시', '성남시', '의정부시', '안양시', '부천시'];
            break;
        case '인천':
            cities = ['중구', '동구', '남구', '연수구', '남동구'];
            break;
        default: cities = null; break;
    }
    res.json({ cities: cities });
}

exports.JsonSchool = function (req, res) {
    var searchSchulNm = encodeURI(req.params.searchSchulNm);
    var gubun = req.params.gubun;
    request('http://www.career.go.kr/cnet/openapi/getOpenApi?apiKey=fb6591284a8fe3b25edd9cf6ada8ecce&svcType=api&svcCode=SCHOOL&contentType=json&gubun=' + gubun + '&searchSchulNm=' + searchSchulNm,
        function (error, response, body) {
        if (!error && response.statusCode == 200) {
            //console.log(body) // Show the HTML for the Google homepage.
            var j = JSON.parse(body);
            res.json(j.dataSearch);
        }
    });
}