var main = require('./handlers/main.js'),
	contest = require('./handlers/contest.js'),
	vacation = require('./handlers/vacation.js'),
	cart = require('./handlers/cart.js'),
	cartValidation = require('./lib/cartValidation.js'),
	contact = require('./handlers/contact.js'),
	samples = require('./handlers/sample.js'),
    user = require('./handlers/user.js'),
    customerController = require('./controllers/customer.js')

module.exports = function(app){
	// miscellaneous routes
	app.get('/', main.home);
	app.get('/about', main.about);
	app.get('/newsletter', main.newsletter);
	app.post('/newsletter', main.newsletterProcessPost);
	app.get('/thank-you', main.genericThankYou);

	// contest routes
	app.get('/contest/vacation-photo', contest.vacationPhoto);
	app.post('/contest/vacation-photo/:year/:month', contest.vacationPhotoProcessPost);

	// vacation routes
	app.get('/vacations', vacation.list);
	app.get('/vacation/:vacation', vacation.detail);
	app.get('/notify-me-when-in-season', vacation.notifyWhenInSeason);
	app.post('/notify-me-when-in-season', vacation.notifyWhenInSeasonProcessPost);

	// shopping cart routes
	app.get('/cart', cart.middleware, cartValidation.checkWaivers, cartValidation.checkGuestCounts, cart.home);
	app.get('/cart/add', cart.addProcessGet);
	app.post('/cart/add', cart.addProcessPost);
	app.get('/cart/checkout', cart.checkout);
	app.post('/cart/checkout', cart.checkoutProcessPost);
	app.get('/cart/thank-you', cart.thankYou);
	app.get('/email/cart/thank-you', cart.emailThankYou);
	app.get('/set-currency/:currency', cart.setCurrency);

	// contact
	app.get('/request-group-rate', contact.requestGroupRate);
	app.post('/request-group-rate', contact.requestGroupRateProcessPost);
	app.get('/contact', contact.home);
    app.post('/contact', contact.homeProcessPost);
    
    // staff
    app.get('/staff', main.staffer);
    app.get('/staff/:city', main.staffer);
    app.get('/staff/:city/:name', main.staffer);

	// testing/sample routes
	app.get('/jquery-test', samples.jqueryTest);
	app.get('/nursery-rhyme', samples.nurseryRhyme);
	app.get('/data/nursery-rhyme', samples.nurseryRhymeData);
    app.get('/epic-fail', samples.epicFail);
    
    // restful Test
    app.get('/user-rest', user.home);
    app.get('/user-rest/:id', user.read);
    app.post('/user-rest', user.create);
    app.del('/user-rest/:id', user.delete);

    // customer routes
    customerController.registerRoutes(app);
};