var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var jqupload = require('jquery-file-upload-middleware');
var fs = require('fs');
var vhost = require('vhost');

var credentials = require('./lib/credentials.js');
var static = require('./lib/static.js').map;

var app = express();

var MongoSessionStore = require('connect-mongo')(session);
var sessionStore = new MongoSessionStore({
    url: credentials.mongo[app.get('env')].connectionString
});
// view engine setup
var exphbs = require('express-handlebars');
app.engine('hbs', exphbs({
    extname: 'hbs', defaultLayout: 'main', helpers: {
        section: function (name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        },
        static: function (name) {
            return static(name);
        }
    }
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.set('port', process.env.PORT || 3000);

// database configuration
var mongoose = require('mongoose');
var options = {
    server: {
        socketOptions: { keepAlive: 1 }
    }
};
switch (app.get('env')) {
    case 'development':
        mongoose.connect(credentials.mongo.development.connectionString, options);
        break;
    case 'production':
        mongoose.connect(credentials.mongo.production.connectionString, options);
        break;
    default:
        throw new Error('Unknown execution environment: ' + app.get('env'));
}

app.use(function (req, res, next) {
    // 이 요청을 처리할 도메인 생성
    var domain = require('domain').create();
    // 도메인에서 일어난 에러 처리
    domain.on('error', function (err) {
        console.error('DOMAIN ERROR CAUGHT\n', err.stack);
        try {
            // 5초 후에 안전한 셧다운
            setTimeout(function () {
                console.error('Failsafe shutdown.');
                process.exit(1);
            }, 5000);
            
            // 클러스터 연결 해제
            var worker = require('cluster').worker;
            if (worker) worker.disconnect();
            
            // 요청을 받는 것을 중지
            server.close();
            
            try {
                // 익스프레스의 에러 라우트 시도
                next(err);
            } catch (error) {
                // 익스프레스의 에러 라우트가 실패하면
                // 일반 노드 응답 사용
                console.error('Express error mechanism failed.\n', error.stack);
                res.statusCode = 500;
                res.setHeader('content-type', 'text/plain');
                res.end('Server error.');
            }
        } catch (error) {
            console.error('Unable to send 500 response.\n', error.stack);
        }
    });
    
    // 도메인에 요청과 응답 객체 추가
    domain.add(req);
    domain.add(res);
    
    // 나머지 요청 체인을 도메인에서 처리
    domain.run(next);
});

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
switch (app.get('env')) {
    case 'development':
        app.use(require('morgan')('dev'));
        break;
    case 'production':
        app.use(require('express-logger')({
            path: __dirname + '/log/requests.log'
        }));
        break;
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(credentials.cookieSecret));
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
    store: sessionStore
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('csurf')());
app.use(function (req, res, next) {
    res.locals._csrfToken = req.csrfToken();
    next();
});
//-----------------------------------------------------------------------------------------------//
app.use(function (req, res, next) {
    var cluster = require('cluster');
    if (cluster.isWorker) console.log('Worker %d received request', cluster.worker.id);
    next();
});
//-----------------------------------------------------------------------------------------------//
// add routes
require('./routes.js')(app);

// add support for auto views
var autoViews = {};

app.use(function (req, res, next) {
    var path = req.path.toLowerCase();
    // 캐쉬가 있으면 뷰를 렌더링합니다.
    if (autoViews[path]) return res.render(autoViews[path]);
    // 캐쉬가 없다면 일치하는 .handlebars 파일이 있는지 확인합니다.
    if (fs.existsSync(__dirname + '/views' + path + '.handlebars')) {
        autoViews[path] = path.replace(/^\//, '');
        return res.render(autoViews[path]);
    }
    // 뷰를 찾을 수 없으므로 404 핸들러에 넘깁니다.
    next();
});

// error handlers

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.status(404).render('404');
});
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).render('500');
});

var server;
var debug = require('debug')('Porcketmentor');
var cluster = require('cluster');

function startWorker() {
    var worker = cluster.fork();
    console.log('CLUSTER: Worker %d started', worker.id);
}

if (cluster.isMaster && app.get('env') === 'production') {
    require('os').cpus().forEach(function () {
        startWorker();
    });
    // 연결이 끊기는 워커를 기록합니다. 워커의 연결이 끊기면 종료해야 하므로,
    // exit 이벤트가 발생하길 기다렸다가 새 워커를 만들어 대체합니다.
    cluster.on('disconnect', function (worker) {
        console.log('CLUSTER: Worker %d disconnected from the cluster.', worker.id);
    });
    
    // 워커가 종료되면 새 워커를 만들어 대체합니다.
    cluster.on('exit', function (worker, code, signal) {
        console.log('CLUSTER: Worker %d died with exit code %d (%s)', worker.id, code, signal);
        startWorker();
    });
} else {
    // 워커에서 앱을 시작합니다.
    server = app.listen(app.get('port'), function () {
        debug('Express server listening on port ' + server.address().port);
        console.log('Express started in ' + app.get('env') +
			' mode on http://localhost:' + app.get('port') +
			'; press Ctrl-C to terminate.');
    });
}
