var User = require('../models/user.js');
var salt = require('../lib/salt.js');
var emailService = require('../lib/email.js')(require('../lib/credentials.js'));

exports.home = function (req, res){
	res.render('index', { title: 'Pocketmentor' });
};

exports.sign = function (req, res) {
    delete req.session.passport;
    res.render('sign', { layout: 'dialog' });
};

exports.loginFail = function (req, res) {
    var userid = req.session.userid;
    delete req.session.userid;
    User.findOne({ userid: new RegExp('^' + userid + ':[0-9]+') }, function (err, user) {
        if (user) {
            idArr = user.userid.split(':');
            res.render('email/user-auth', 
    	        { layout: null, tocken: idArr[1], name: user.name, id: idArr[0] }, function (err, html) {
                    if (err) console.error('error in email template: ' + err.stack);
                    emailService.send(user.email,
	                'Pocketmentor :: 사용자 인증',
	        	    html);
                }
            );
            
            req.session.flash = {
                type: 'warning',
                title: '인증되지 않은 아이디 :: ',
                message: '해당 이메일로 다시 인증하세요.'
            }
            req.session.remail = { email: user.email, name: user.name, id: idArr[0] };
            res.redirect(303, '/user-remail');
        } else {
            req.session.flash = {
                type: 'danger',
                title: '로그인 실패 :: ',
                message: '아이디나 비밀번호가 틀렸습니다.'
            }
            res.redirect(303, '/sign');
        }
    });
}

exports.already = function (req, res) {
    var id = req.params.id;
    User.find({ userid: new RegExp('^(' + id + ':[0-9]+|' + id + '$)') }, function (err, user) {
        if (err) return res.status(500).send('error: Internal error.');
        res.json(
            (user.length) ? { msg: 'already' } : { msg: '' }
        );
    });
}

exports.register = function (req, res) {
    var id = req.body.userid;

    User.find({ userid: new RegExp('^(' + id + ':[0-9]+|' + id + '$)') }, function (err, user) {
        if (err) return res.status(500).send('error: Internal error.');
        if (user.length) return res.redirect(303, '/register-fail');
        
        var tocken = salt.tocken();
        var userid = id + ':' + tocken;
        var password = salt.password(req.body.password);
        var user = new User({
            userid: userid,
            password: password,
            name: req.body.name,
            email: req.body.email,
            gender : null,
            age : null,
            university: null,
            highSchool: null,
            middleSchool: null,
            address: null,
            specialty: null,
            point: null,
            mento: null,
            picture: null,
            date: new Date()
        });
        user.save(function (err, user) {
            if (err) {
                console.log('user save error:' + err);
                return res.status(500).send('error: Unable to add user.');
            }

            res.render('email/user-auth', 
    	        { layout: null, tocken: tocken, name: user.name, id: id }, function (err, html) {
                    if (err) console.error('error in email template: ' + err.stack);
                    emailService.send(user.email,
	        	    'Pocketmentor :: 사용자 인증',
	        	    html);
                }
            );
            
            req.session.remail = { email: user.email, name: user.name, id: id };
            res.redirect(303, '/user-remail');
        });
    });
};

exports.registerFail = function (req, res) {
    req.session.flash = {
        type: 'danger',
        title: '회원가입 실패 :: ',
        message: '회원정보를 다시 확인하세요.',
        goto: 'register'
    }
    res.redirect(303, '/sign');
}

exports.remail = function (req, res) {
    var id = req.params.id
    if (id) {
        var tocken = salt.tocken();
        User.findOneAndUpdate({ userid: new RegExp('^' + id + ':[0-9]+') }, { userid: id + ':' + tocken, email: req.body.email }, function (err, user) {
            if (err) console.log(err);
            res.render('email/user-auth',
    	        { layout: null, tocken: tocken, name: user.name, id: id }, function (err, html) {
                    if (err) console.error('error in email template: ' + err.stack);
                    emailService.send(req.body.email,
	        	    'Pocketmentor :: 사용자 인증',
	        	    html);
                }
            );
            res.json(
                (err === null) ? { msg: 'success' } : { msg: 'fail' }
            );
        });
    } else {
        if (!req.session.remail) return res.redirect(303, '/sign');
        res.locals.remail = req.session.remail;
        delete req.session.remail;
        res.render('user-remail', { layout: 'dialog' });
    }
}

exports.auth = function (req, res) {
    var userid = req.params.id + ':' + req.params.tocken;
    User.findOneAndUpdate({ userid: userid }, { userid: req.params.id }, function (err, user) {
        if (err) {
            console.log('user auth error:' + err);
            return res.status(500).send('error: Unable to auth user.');
        }
        if (!user) {
            return res.json({ 'auth': 'fail' });
        }
        req.session.flash = {
            type: 'success',
            title: '인증 성공 :: ',
            message: '로그인해 주세요.'
        }
        res.redirect(303, '/sign');
    });
}

exports.logout = function (req, res) {
    req.logout();
    res.redirect(303, '/sign');
};