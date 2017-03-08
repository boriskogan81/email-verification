const LocalStrategy   = require('passport-local').Strategy;
const randomstring = require("randomstring");

// load up the user model
const User            = require('../models/user');
const mailer = require ('./mailgun.js');
const helper = require('sendgrid').mail;

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (user) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            } else {

                // if there is no user with that email
                // create the user
                var newUser            = new User();
                var permalink = req.body.email.toLowerCase().replace(' ', '').replace('@', '').replace(/[^\w\s]/gi, '').trim();
                var verification_token = randomstring.generate({
                                length: 64
                            });
                var address;
                if (req.body.gender === 'male'){ address = 'Mr.'}else{address = 'Ms.'};
                
                // set the user's local credentials
                
                newUser.local.email    = email;
                newUser.local.password = newUser.generateHash(password);
                newUser.local.gender   = req.body.gender;
                newUser.local.address  = address;
                newUser.local.name     = req.body.name;
                newUser.local.birthday = new Date(req.body.bday);
                newUser.local.permalink= permalink;
                newUser.local.verified = false;
                newUser.local.verify_token = verification_token;
                
                // save the user
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    verifyEmail(email, verification_token, permalink);
                    return done(null, newUser);
                });
            }

        });    

        });

    }));

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            return done(null, user);
        });

    }));
    
    function verifyEmail(email, verification_token, permalink){
        var link = "https://mail-verification-baruchkogan.c9users.io/verify/" + permalink + '/' + verification_token;
        var mailBody = "Hello,<br> Please click on the link to verify your email.<br><a href="+link+">Click here to verify</a>";
        
        from_email = new helper.Email("test@example.com");
        to_email = new helper.Email(email);
        subject = "Please verify your email";
        content = new helper.Content("text/html", mailBody);
        mail = new helper.Mail(from_email, subject, to_email, content);
        
        var sg = require('sendgrid')(system.envblablabla);
        var request = sg.emptyRequest({
          method: 'POST',
          path: '/v3/mail/send',
          body: mail.toJSON()
        });
        
        sg.API(request, function(error, response) {
          console.log(response.statusCode);
          console.log(response.body);
          console.log(response.headers);
        })
    }
};
