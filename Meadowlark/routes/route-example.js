var express = require('express');
var router = express.Router();

router.use(function (req, res, next) {
    console.log('\n\nALLWAYS');
    next();
});

router.get('/a', function (req, res) {
    console.log('/a: route terminated');
    res.send('a');
});
router.get('/a', function (req, res) {
    console.log('/a: never called');
});
router.get('/b', function (req, res, next) {
    console.log('/b: route not terminated');
    next();
});
router.use(function (req, res, next) {
    console.log('SOMETIMES');
    next();
});
router.get('/b', function (req, res, next) {
    console.log('/b (part 2): error thrown');
    throw new Error('b failed');
});
router.use('/b', function (err, req, res, next) {
    console.log('/b error detected and passed on');
    next(err);
});
router.get('/c', function (err, req) {
    console.log('/c: error thrown');
    throw new Error('c failed');
});
router.use('/c', function (err, req, res, next) {
    console.log('/c: error deteccted but not passed on');
    next();
});

router.use(function (err, req, res, next) {
    console.log('unhandled error detected: ' + err.message);
    res.send('500 - server error');
});

router.use(function (req, res) {
    console.log('route not handled');
    res.send('404 - not found');
});

module.exports = router;