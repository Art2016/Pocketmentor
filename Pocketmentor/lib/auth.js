var User = require('../models/user.js'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var salt = require('../lib/salt.js').password;

// 인증후, 사용자 정보를 세션에 저장
passport.serializeUser(function(user, done){
	done(null, user._id);
});
// 인증후, 사용자 정보를 세션에서 읽어서 request.user에 저장
passport.deserializeUser(function(id, done){
	User.findById(id, function(err, user){
		if(err || !user) return done(err, null);
		done(null, user);
	});
});

module.exports = function (app, options){
    // 성공이나 실패 리다이렉션이 명시되지 않았을 때
    // 사용할 기본값을 정합니다.
	if(!options.successRedirect)
		options.successRedirect = '/';
	if(!options.failureRedirect)
		options.failureRedirect = '/sign';

	return {
		init: function() {
			var env = app.get('env');
			var config = options.providers;
            
            // 자체 인증 처리
            passport.use(new LocalStrategy({
                usernameField : 'userid',
                passwordField : 'password',
                passReqToCallback : true
            }, function (req, userid, password, done) {
                User.findOne({ userid: userid, password: salt(password) }, function (err, user) {
                    if (err) return done(err, null);
                    if (user) return done(null, user);
                    else {
                        req.session.userid = userid;
                        return done(null, false);
                    }
                });
            }));
			// 페이스북 인증 전략 설정
			passport.use(new FacebookStrategy({
				clientID: config.facebook[env].appId,
				clientSecret: config.facebook[env].appSecret,
                callbackURL: (options.baseUrl || '') + '/auth/facebook/callback',
                profileFields: ['id', 'displayName', 'name', 'email', 'gender']
            }, function (accessToken, refreshToken, profile, done){
                console.log(JSON.stringify(profile));

                var authId = 'facebook:' + profile.id;
				User.findOne({ userid: authId }, function(err, user){
					if(err) return done(err, null);
					if(user) return done(null, user);
					user = new User({
                        userid: authId,
                        password: null,
                        name: profile.displayName,
                        email: profile.emails ? profile.emails[0].value : '',
                        gender : profile.gender ? profile.gender : '',
                        auth: true
					});
					user.save(function(err){
						if(err) return done(err, null);
						done(null, user);
					});
				});
			}));
            // 구글 인증 전략 설정
			passport.use(new GoogleStrategy({
				clientID: config.google[env].clientID,
				clientSecret: config.google[env].clientSecret,
				callbackURL: (options.baseUrl || '') + '/auth/google/callback',
            }, function (token, tokenSecret, profile, done){
                console.log(JSON.stringify(profile));

				var authId = 'google:' + profile.id;
				User.findOne({ userid: authId }, function(err, user){
					if(err) return done(err, null);
					if(user) return done(null, user);
                    user = new User({
                        userid: authId,
                        password: null,
                        name: profile.displayName,
                        email: profile.emails ? profile.emails[0].value : '',
                        gender : profile.gender ? profile.gender : '',
                        auth: true
                    });
					user.save(function(err){
						if(err) return done(err, null);
						done(null, user);
					});
				});
			}));
            
			app.use(passport.initialize());
			app.use(passport.session());
		},

        registerRoutes: function (){
            // 자체 인증 라우트
            app.post('/login', passport.authenticate('local',
                { failureRedirect: options.failureRedirect }),
                function (req, res) {
                    var redirect = req.session.authRedirect;
                    if (redirect) delete req.session.authRedirect;
                    res.redirect(303, redirect || options.successRedirect);
                }
            );

			// 페이스북 라우트를 등록합니다.
			app.get('/auth/facebook', function(req, res, next){
				if(req.query.redirect) req.session.authRedirect = req.query.redirect;
				passport.authenticate('facebook', { scope: ['email'] })(req, res, next);
			});
			app.get('/auth/facebook/callback', passport.authenticate('facebook', 
				{ failureRedirect: options.failureRedirect }),
				function(req, res){
					//인증이 성공해야 여기 도달합니다.
					var redirect = req.session.authRedirect;
					if(redirect) delete req.session.authRedirect;
					res.redirect(303, redirect || options.successRedirect);
				}
			);
            
			// 구글 라우트를 등록합니다.
			app.get('/auth/google', function(req, res, next){
				if(req.query.redirect) req.session.authRedirect = req.query.redirect;
                passport.authenticate('google', {
                    scope: [
                        'profile',
                        'https://www.googleapis.com/auth/plus.profile.emails.read'
                    ]
                })(req, res, next);
			});
			app.get('/auth/google/callback', passport.authenticate('google', 
				{ failureRedirect: options.failureRedirect }),
				function(req, res){
                    //인증이 성공해야 여기 도달합니다.
					var redirect = req.session.authRedirect;
					if(redirect) delete req.session.authRedirect;
					res.redirect(303, req.query.redirect || options.successRedirect);
				}
			);
            
		},

	};
};
