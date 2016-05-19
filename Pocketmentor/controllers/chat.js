
module.exports = {
    registerRoutes: function (app, io) {
        io.on('connection', function (socket) {
            socket.on('send', function (msg) {
                //socket.broadcast.emit('chat message', msg);
                io.emit('receive', msg);
            });
        });
		app.get('/chat', this.view);
	},

    view: function (req, res) {
        res.render('chat', { layout: null });
	}
};
