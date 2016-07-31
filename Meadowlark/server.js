var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var jqupload = require('jquery-file-upload-middleware');
var fs = require('fs');
var vhost = require('vhost');
var stylus = require('stylus');

var routeExam = require('./routes/route-example');

var weatherData = require('./lib/weatherData.js');
var credentials = require('./lib/credentials.js');
var static = require ('./lib/static.js');

var Vacation = require('./models/vacation.js');

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
            return static.map(name);
        }
    }
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

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
Vacation.find(function (err, vacations) {
    if (err) return console.log(err);
    if (vacations.length) return;

    new Vacation({
        name: 'Hood River Day Trip',
        slug: 'hood-river-day-trip',
        category: 'Day Trip',
        sku: 'HR199',
        description: 'Spend a day sailing on the Columbia and ' +
            'enjoying craft beers in Hood River!',
        priceInCents: 9995,
        tags: ['day trip', 'hood river', 'sailing', 'windsurfing', 'breweries'],
        inSeason: true,
        maximumGuests: 16,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Oregon Coast Getaway',
        slug: 'oregon-coast-getaway',
        category: 'Weekend Getaway',
        sku: 'OC39',
        description: 'Enjoy the ocean air and quaint coastal towns!',
        priceInCents: 269995,
        tags: ['weekend getaway', 'oregon coast', 'beachcombing'],
        inSeason: false,
        maximumGuests: 8,
        available: true,
        packagesSold: 0,
    }).save();

    new Vacation({
        name: 'Rock Climbing in Bend',
        slug: 'rock-climbing-in-bend',
        category: 'Adventure',
        sku: 'B99',
        description: 'Experience the thrill of rock climbing in the high desert.',
        priceInCents: 289995,
        tags: ['weekend getaway', 'bend', 'high desert', 'rock climbing', 'hiking', 'skiing'],
        inSeason: true,
        requiresWaiver: true,
        maximumGuests: 4,
        available: false,
        packagesSold: 0,
        notes: 'The tour guide is currently recovering from a skiing accident.',
    }).save();
});

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
            //server.close();

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

app.use(stylus.middleware({
    src: path.join(__dirname, 'public'),
    compile: function (str, path) {
        return stylus(str).define('static', stylus.url({ paths: static.baseUrl }));
    }
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('csurf')());
app.use(function (req, res, next) {
    res.locals._csrfToken = req.csrfToken();
    next();
});
//-----------------------------------------------------------------------------------------------//
app.use(function (req, res, next) {
    res.locals.showTests = (app.get('env') !== 'production') && (req.query.test === '1');
    next();
});

app.use(function (req, res, next) {
    if (!res.locals.partials) res.locals.partials = {};
    res.locals.partials.weatherContext = weatherData.getWeatherData();
    next();
});

app.use(function (req, res, next) {
    // 플래시 메시지가 있다면 콘텍스트에 전달한 다음 지웁니다.
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});

app.use(function (req, res, next) {
    var cluster = require('cluster');
    if (cluster.isWorker) console.log('Worker %d received request', cluster.worker.id);
    next();
});

app.use(function (req, res, next) {
    var now = new Date();
    res.locals.logoImage = now.getHours() == 22 ? static.map('/images/finish.jpg') : static.map('/images/logo.jpg');
    next();
});

app.use(function (req, res, next) {
    var cart = req.session.cart;
    res.locals.cartItems = (cart && cart.items) ? cart.items.length : 0;
    next();
});
//-----------------------------------------------------------------------------------------------//
app.use('/route-example', routeExam);

app.get('/headers', function (req, res) {
    res.set('Content-Type', 'text/plain');
    var s = '';
    for (var name in req.headers) s += name + ': ' + req.headers[name] + '\n';
    res.send(s);
});

app.use('/upload', function (req, res, next) {
    var now = Date.now();
    jqupload.fileHandler({
        uploadDir: function (){
            return __dirname + '/public/uploads/' + now;
        },
        uploadUrl: function (){
            return '/uploads/' + now;
        }
    })(req, res, next);
});

// add routes
require('./routes.js')(app);

//-----------------------------------------------------------------------------------------------//
// api
var Attraction = require('./models/attraction.js');
/*
// API configuration
var apiOptions = {
    context: '/',
    domain: require('domain').create(),
};

apiOptions.domain.on('error', function (err) {
    console.log('API domain error.\n', err.stack);
    setTimeout(function () {
        console.log('Server shutting down after API domain error.');
        process.exit(1);
    }, 5000);
    //server.close();
    var worker = require('cluster').worker;
    if (worker) worker.disconnect();
});
*/
//var rest = require('connect-rest').create(apiOptions);

//app.use(rest.processRequest());

// link API into pipeline
//app.use(vhost('api.*', rest.rester(apiOptions)));

var api = express.Router();
app.use(vhost('api.*', api));

api.get('/attractions', function (req, res) {
    Attraction.find({ approved: false }, function (err, attractions) {
        if (err) return res.status(500).send('error: Internal error.');
        res.json(attractions.map(function (a) {
            return {
                name: a.name,
                description: a.description,
                location: a.location,
            };
        }));
    });
});

api.post('/attraction', function (req, res) {
    var a = new Attraction({
        name: req.body.name,
        description: req.body.description,
        location: { lat: req.body.lat, lng: req.body.lng },
        history: {
            event: 'created',
            email: req.body.email,
            date: new Date(),
        },
        approved: false,
    });
    a.save(function (err, a) {
        if (err) return res.status(500).send('error: Unable to add attraction.');
        res.json({ id: a._id });
    });
});

api.get('/attraction/:id', function (req, res) {
    Attraction.findById(req.params.id, function (err, a) {
        if (err) return res.status(500).send('error: Unable to retrieve attraction.');
        res.json({
            name: a.name,
            description: a.description,
            location: a.location,
        });
    });
});
//-----------------------------------------------------------------------------------------------//

// authentication
var auth = require('./lib/auth.js')(app, {
    // baseUrl은 옵션이며, 생략할 경우 기본값은 localhost입니다.
    // 로컬에서 작업하지 않을 때는 baseUrl이 유용한데,
    // 예를 들어 스테이징 서버가 있다면 BASE_URL 환경 변수를
    // https://staging.meadowlark.com으로 설정하면 됩니다.
    baseUrl: process.env.BASE_URL,
    providers: credentials.authProviders,
    successRedirect: '/account',
    failureRedirect: '/unauthorized',
});
// auth.init()는 패스포트 미들웨어를 연결합니다.
auth.init();
// 이제 인증 라우트를 사용할 수 있습니다.
auth.registerRoutes();

function customerOnly(req, res, next) {
    if (req.user && req.user.location === 'customer') return next();
    // 고객 전용 페이지를 만들어, 로그인해야 함을 알리고 싶습니다.
    res.redirect(303, '/unauthorized');
}
function employeeOnly(req, res, next) {
    if (req.user && req.user.location === 'employee') return next();
    // 직원 전용 승인에 실패했다는 결과를 숨겨서, 잠재적 해커가 그런 페이지가
    // 존재한다는 사실조차 모르게 하고 싶습니다.
    next('route');
}
function allow(roles) {
    return function (req, res, next) {
        if (req.user && roles.split(',').indexOf(req.user.location) !== -1) return next();
        res.redirect(303, '/unauthorized');
    };
}

// 고객용 라우트
app.get('/account', allow('customer,employee'), function (req, res) {
    if (!req.user) return res.redirect(303, '/unauthorized');
    res.render('account', { username: req.user.fullname });
});
app.get('/account/order-history', customerOnly, function (req, res) {
    res.render('account/order-history');
});
app.get('/account/email-prefs', customerOnly, function (req, res) {
    res.render('account/email-prefs');
});

// 직원용 라우트
app.get('/sales', employeeOnly, function (req, res) {
    res.render('sales');
});

// '인증되지 않음' 페이지도 필요합니다.
app.get('/unauthorized', function (req, res) {
    res.status(403).render('unauthorized');
});

app.get('/test', function (req, res) {
    res.render('test');
});

app.get('/mecab-test', function (req, res){
    var mecab = require('mecab-ya');

    var text = 'english is bad';

    mecab.pos(text, function (err, result) {
        console.log(err);
        console.log(result);
        res.send(result);
        /*
            [ [ '아버지', 'NNG' ],
              [ '가', 'JKS' ],
              [ '방', 'NNG' ],
              [ '에', 'JKB' ],
              [ '들어가', 'VV' ],
              [ '신다', 'EP+EC' ] ]
        */
    });
});

app.get('/twtkr-test', function (req, res) {
    var TwitterKoreanText = require('twtkrjs');
    var processor = new TwitterKoreanText({
      stemmer: false,      // (optional default: true)
      normalizer: false,   // (optional default: true)
      spamfilter: true     // (optional default: false)
    });

    processor.tokenizeToStrings("한국어를 처리하는 예시입니닼ㅋㅋㅋㅋㅋ", function(err, result) {
        console.log(result);
        res.send(result);
    })
});

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

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    res.status(404).render('404');
});

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).render('500');
});

module.exports = app;
