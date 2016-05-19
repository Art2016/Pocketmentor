var fortune = require('../lib/fortune.js');

exports.home = function(req, res){
	res.render('home');
};

exports.about = function(req, res){
	res.render('about', { 
		fortune: fortune.getFortune(),
		pageTestScript: '/qa/tests-about.js' 
	} );
};

exports.newsletter = function(req, res){
	res.render('newsletter', { csrf: 'CSRF token goes here' });
};

// for now, we're mocking NewsletterSignup:
function NewsletterSignup(){
}
NewsletterSignup.prototype.save = function(cb){
	cb();
};

var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

exports.newsletterProcessPost = function(req, res){
    console.log('Form (from querysting): ' + req.query.form);
    console.log('CSRF token (from hidden field): ' + req.body._csrf);
    console.log('Name (from visible form field): ' + req.body.name);
    console.log('Email (from visible form field): ' + req.body.email);
    
    /*
    if (req.xhr || req.accepts('json.html') === 'json') {
        res.send({ success: true });
        // 에러가 있다면 { error: 'error description' }을 보냅니다.
    } else {
        res.redirect(303, '/thank-you');
        // 에러가 있다면 에러 페이지로 리다이렉트합니다.
    }
    */

    var name = req.body.name || '', email = req.body.email || '';
    // input validation
    if (!email.match(VALID_EMAIL_REGEX)) {
        if (req.xhr) return res.json({ error: 'Invalid name email address.' });
        req.session.flash = {
            type: 'danger',
            intro: 'Validation error!',
            message: 'The email address you entered was  not valid.',
        };
        return res.redirect(303, '/thank-you');
    }
    new NewsletterSignup({ name: name, email: email }).save(function (err) {
        if (err) {
            if (req.xhr) return res.json({ error: 'Database error.' });
            req.session.flash = {
                type: 'danger',
                intro: 'Database error!',
                message: 'There was a database error; please try again later.',
            };
            return res.redirect(303, '/thank-you');
        }
        if (req.xhr) return res.json({ success: true });
        req.session.flash = {
            type: 'success',
            intro: 'Thank you!',
            message: 'You have now been signed up for the newsletter.',
        };
        return res.redirect(303, '/thank-you');
    });
}

exports.genericThankYou = function(req, res){
	res.render('thank-you');
}

var staff = {
    portland: {
        name: 'portland',
        staffs: [
            {
                name: 'mitch',
                bio: 'Mitch is the man to have at your back in bar fight.'
            },
            {
                name: 'madeline',
                bio: 'Madeline is our Oregon expert.'
            }
        ]
    },
    bend: {
        name: 'bend',
        staffs: [
            {
                name: 'walt',
                bio: 'Walt is our Oregon Coast expert.'
            }
        ]
    }
}

exports.staffer = function (req, res, next){
    if (!req.params.city) {
        res.render('staffer', { 'cities': staff });
        return;
    }
    var city = staff[req.params.city];
    if (!req.params.name && city) {
        res.render('staffer', { 'city': city });
        return;
    } else if (!city){
        res.render('staffer', { 'notFound': '지역' });
        return;
    }
    var staffInfo = city.staffs.filter(function (item) { return item.name === req.params.name; });
    if (staffInfo.length !== 0) {
        res.render('staffer', { 'info': staffInfo[0].bio });
        return;
    }

    res.render('staffer', { 'notFound': '직원' });
}