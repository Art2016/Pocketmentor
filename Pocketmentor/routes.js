var credentials = require('./lib/credentials.js');
var main = require('./handlers/main.js');

module.exports = function (app){
    // authentication
    var auth = require('./lib/auth.js')(app, {
        // baseUrl은 옵션이며, 생략할 경우 기본값은 localhost입니다.
        // 로컬에서 작업하지 않을 때는 baseUrl이 유용한데,
        // 예를 들어 스테이징 서버가 있다면 BASE_URL 환경 변수를
        // https://staging.meadowlark.com으로 설정하면 됩니다.
        baseUrl: process.env.BASE_URL,
        providers: credentials.authProviders,
        successRedirect: '/',
        failureRedirect: '/login-fail',
    });
    // auth.init()는 패스포트 미들웨어를 연결합니다.
    auth.init();
    // 이제 인증 라우트를 사용할 수 있습니다.
    auth.registerRoutes();
    
    function userAuth (req, res, next) {
        if (req.isAuthenticated()) return next();
        res.redirect(303, '/sign');
    }
    app.use(function (req, res, next) {
        res.locals.user = req.user;
        next();
    });

	// miscellaneous routes
    app.get('/', userAuth, main.home);
    
    // 사용자 인증
    app.get('/sign', main.sign);
    app.get('/login-fail', main.loginFail);
    app.get('/register/:id', main.already);
    app.post('/register', main.register);
    app.get('/register-fail', main.registerFail);
    app.get('/user-remail', main.remail);
    app.put('/user-remail/:id', main.remail);
    app.get('/user-auth/:tocken/id/:id', main.auth);
    app.get('/logout', main.logout);
};