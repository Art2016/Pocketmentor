var path = require('path'),
	fs = require('fs'),
	formidable = require('formidable');

// 디렉토리가 존재하는지 확인하고 없으면 만듭니다.
var dataDir = path.normalize(path.join(__dirname, '..', 'data'));
var vacationPhotoDir = path.join(dataDir, 'vacation-photo');
fs.existsSync(dataDir) || fs.mkdirSync(dataDir); 
fs.existsSync(vacationPhotoDir) || fs.mkdirSync(vacationPhotoDir);

exports.vacationPhoto = function(req, res){
    var now = new Date();
    res.render('contest/vacation-photo', {
        year: now.getFullYear(), month: now.getMonth()
    });
};

function saveContestEntry(contestName, email, year, month, photoPath){
    // TODO...this will come later
}

exports.vacationPhotoProcessPost = function(req, res){
    var form = new formidable.IncomingForm();
    form.uploadDir = "D:/tmp"; // 업로드 될 임시 디렉토리와 파일명변경 후 저장 될 디렉토리의 파티션이 다를 경우.
    form.parse(req, function(err, fields, files){
        if(err) return res.redirect(303, '/error');
        if(err) {
            res.session.flash = {
                type: 'danger',
                intro: 'Oops!',
                message: 'There was an error processing your submission. ' +
                    'Pelase try again.',
            };
            return res.redirect(303, '/contest/vacation-photo');
        }
        var photo = files.photo;
        var dir = vacationPhotoDir + '/' + Date.now();
        var path = dir + '/' + photo.name;
        fs.mkdirSync(dir);
        fs.renameSync(photo.path, dir + '/' + photo.name);
        saveContestEntry('vacation-photo', fields.email,
            req.params.year, req.params.month, path);
        req.session.flash = {
            type: 'success',
            intro: 'Good luck!',
            message: 'You have been entered into the contest.',
        };
        return res.redirect(303, '/thank-you');
    });
};