var fortunes = [
    "good!",
    "nice!",
    "thanks!"
];
exports.getFortune = function () {
    var randomFortune = Math.floor(Math.random() * fortunes.length);
    return fortunes[randomFortune];
};