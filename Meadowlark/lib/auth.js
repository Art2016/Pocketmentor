var User = require('../models/user.js'),
	passport = require('passport'),
	FacebookStrategy = require('passport-facebook').Strategy;
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
passport.serializeUser(function(user, done){
	done(null, user._id);
});
passport.deserializeUser(function(id, done){
	User.findById(id, function(err, user){
		if(err || !user) return done(err, null);
		done(null, user);
	});
});

module.exports = function (app, options){
	if(!options.successRedirect)
		options.successRedirect = '/account';
	if(!options.failureRedirect)
		options.failureRedirect = '/login';

	return {
		init: function() {
			var env = app.get('env');
			var config = options.providers;

            passport.use(new FacebookStrategy({
                clientID: config.facebook[env].appId,
                clientSecret: config.facebook[env].appSecret,
                callbackURL: (options.baseUrl || '') + '/auth/facebook/callback',
                profileFields: ['id', 'displayName', 'name', 'email', 'gender']
            }, function (accessToken, refreshToken, profile, done) {
                console.log(JSON.stringify(profile));
                console.log(!(profile.emails) ? '' : profile.emails[0].value);

                var authId = 'facebook:' + profile.id;
				User.findOne({ username: authId }, function(err, user){
					if(err) return done(err, null);
					if(user) return done(null, user);
					user = new User({
                        username: authId,
                        email: profile.emails[0].value,
                        fullname: profile.displayName,
                        age: null,
                        location: 'customer',
                        gender: 'gender',
					});
					user.save(function(err){
						if(err) return done(err, null);
						done(null, user);
					});
				});
			}));
			passport.use(new GoogleStrategy({
				clientID: config.google[env].clientID,
				clientSecret: config.google[env].clientSecret,
				callbackURL: (options.baseUrl || '') + '/auth/google/callback',
            }, function (token, tokenSecret, profile, done){
                console.log(JSON.stringify(profile));

				var authId = 'google:' + profile.id;
				User.findOne({ username: authId }, function(err, user){
					if(err) return done(err, null);
					if(user) return done(null, user);
					user = new User({
                        username: authId,
                        email: 'test@test.com',
                        fullname: profile.displayName,
                        age: 0,
                        location: 'employee',
                        gender: 'gender',
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

		registerRoutes: function(){
			app.get('/auth/facebook', function(req, res, next){
				if(req.query.redirect) req.session.authRedirect = req.query.redirect;
				passport.authenticate('facebook', { scope: ['email'] })(req, res, next);
			});
			app.get('/auth/facebook/callback', passport.authenticate('facebook',
				{ failureRedirect: options.failureRedirect }),
				function(req, res){
					var redirect = req.session.authRedirect;
					if(redirect) delete req.session.authRedirect;
					res.redirect(303, redirect || options.successRedirect);
				}
			);

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
					var redirect = req.session.authRedirect;
					if(redirect) delete req.session.authRedirect;
					res.redirect(303, req.query.redirect || options.successRedirect);
				}
			);

		},

	};
};
