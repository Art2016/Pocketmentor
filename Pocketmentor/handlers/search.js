var User = require('../models/user.js');

exports.find = function (req, res){
    // 모든 값 정규식
    var entirety = new RegExp('.*');
    // 이름 검색 정규식
    var name = (req.query.userName) ? new RegExp('.*'+req.query.userName+'.*', 'i') : entirety
    // 관심분야 검색 배열 체크
    var specialty;
    if (!req.query.specialty) specialty = [entirety];
    else {
        if (req.query.specialty instanceof Array) specialty = req.query.specialty;
        else {
            specialty = [req.query.specialty];
            res.locals.specialty = specialty;
        }
    }
    // 필드 수
    var size = 12;
    // 페이지 수
    var n = req.params.next || 0;
    // 내 정보
    var my = req.user;
    // 쿼리
    var query = {
        userid: { $ne: my.userid }, // 내 정보를 제외
        name: name,
        region: req.query.bigCity || entirety,
        city: req.query.city || entirety,
        middleSchool: req.query.middleSchool || entirety,
        highSchool: req.query.highSchool || entirety,
        university: req.query.university || entirety,
        specialty: { $in: specialty },
        auth: true
    }
    User.find(query, {}, { limit: size+1 /*다음 필드 확인*/, skip: size*n }, function (err, users) {
        if (err) return res.status(500).send('error: Internal error.');
        if(!users.length) return res.render('search-result', { search: req.query, notmentor: '검색결과가 없습니다.', more: false });
        
        var mentors = users.map(function (user, index) {
            if (index === size) return null; // 보여줄 필드 초과시 return
            if(my.mentor) var mentorAdd = (my.mentor.indexOf(user.userid) != -1); // 멘토 리스트 확인
            if(my.favorites) var favorite = (my.favorites.indexOf(user.userid) != -1); // 추천 멘토 확인
            return {
                userid: user.userid,
                name: user.name,
                picture: user.picture,
                specialty: user.specialty,
                point: user.point,
                menteeNum: user.getMenteeNum(),
                mentorAdd: mentorAdd,
                favorite: favorite
            };
        });
        
        var more = true;
        if (mentors.length === size+1) mentors.pop(); // 초과한 마지막 배열 삭제
        else more = false; // 끝 페이지

        if (req.params.next) res.json({ mentors: mentors, more: more }); // 다음 리스트 요구시 ajax 호출 json값
        else res.render('search-result', { search: req.query, mentors: mentors, more: more });
    });
};

exports.favoiteAdd = function (req, res) {
    User.findByIdAndUpdate(req.user._id, { '$push': { 'favorites': req.params.id } }, function (err, user) {
        if (err) console.log(err);
        res.json(
            (err === null) ? { msg: 'success' } : { msg: err }
        );
    });
};

exports.favoiteDel = function (req, res) {
    User.findByIdAndUpdate(req.user._id, { '$pull': { 'favorites': req.params.id } }, function (err, user) {
        if (err) console.log(err);
        res.json(
            (err === null) ? { msg: 'success' } : { msg: err }
        );
    });
};