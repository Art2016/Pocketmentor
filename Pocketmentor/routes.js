var main = require('./handlers/main.js');
var cors = require('cors');

module.exports = function(app){
	// miscellaneous routes
	app.get('/', cors(), main.home);
};