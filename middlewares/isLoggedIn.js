
function ensureLoggedIn(req, res, next) {
    if(req.session.username) {
        return next()
    } else {
        res.send('Error, You Have to be logged on to do this!');
    }
}

module.exports = ensureLoggedIn;