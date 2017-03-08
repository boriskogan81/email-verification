const User     = require('./models/user');
module.exports = function(app, passport) {

    // HOME PAGE (with login links) ========

    app.get('/', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });

    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { 
            message: req.flash('loginMessage'),
            prefill: ''
        }); 
    });

    // show the signup form
    app.get('/signup', function(req, res) {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });
    
    app.get('/intermediate', isLoggedIn, function(req, res) {
        var address; 
        if(req.user.local.gender === "male"){address = "Mr."}
        else {address = "Ms. "}
        var signupMessage = address + " " + req.user.local.name + ": Thank you for signing up. We've sent a confirmation email to " + req.user.local.email + ". Please click the link in the email to confirm.";
        res.render('intermediate.ejs', { message: signupMessage });
    });

    // PROFILE SECTION =====================
    app.get('/profile', isLoggedIn, function(req, res) {
        if(req.user.local.verified === true){
            res.render('profile.ejs', {
                user : req.user,
                
            });
        }else{
            res.redirect('/intermediate');
        }
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
    
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/intermediate', // intermediate section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    
    app.get('/verify/:permalink/:token', function (req, res) {
        var permalink = req.params.permalink;
        var token = req.params.token;
        
        User.findOne({'local.permalink': permalink}, function (err, user) {
            if(err)
                {console.log('error',err)}
            if (user.local.verify_token == token) {
                console.log('that token is correct! Verify the user');

                User.findOneAndUpdate({'local.permalink': permalink}, {'local.verified': true}, function (err, resp) {
                    if(err)
                        {console.log('error',err)}
                    console.log('The user has been verified!');
                });

                res.render('login.ejs', {
                    message: '',
                    prefill : user.local.email
                });
            } else {
                console.log('The token is wrong! Reject the user. token should be: ' + user.local.verify_token);
            }
        });
    });
};

function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

    