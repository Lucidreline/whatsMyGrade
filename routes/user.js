require("dotenv").config();
//Imports the pasports and express packages.
    //Passport allows us to use user authentication.
var localStrategy = require("passport-local"),
    passport = require("passport"),
    express = require("express"),
    router = express.Router()

//Used for password recovery
var api_key = process.env.MAILGUN_API_KEY,
    domain = process.env.MAILGUN_DOMAIN,
    mailgun = require('mailgun-js')({apiKey: api_key, domain: domain}),
    async = require("async"),
    crypto = require("crypto")

//Gives this file access to the user model
var User = require("../models/user");

//Not sure what these do exactly, but I know they contribute to the user's logging in
passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Renders the login/register form
router.get("/user/login", (req, res)=> res.render("./user/registerLogin"));

//Takes in the data from the register form
router.post("/user/register", (req, res)=>{
    //Creates a new user and gives it the data
    User.register(new User({
        firstName: req.body.firstName,
        email: req.body.email,
        username: req.body.username,

    }), req.body.password, function(err, createdUser){
        if(err){
            console.log("Error registering a new User: " + err.message);
            return res.render("User/registerLogin");
        }
        //Logs in the new user
        passport.authenticate("local")(req, res, function(){
            res.redirect("/courses");
        })
    })
})

//Login ====================================
//Takes in the data from the login form
router.post("/user/login", passport.authenticate("local", {
    //If the password matches, the user is redirected to home, else the login page is refreshed
    successRedirect: "/courses",
    failureRedirect: "/user/login"
}));
//==========================================

//LOG OUT =================================
router.get("/user/logout", function(req, res){
    req.logOut();
    res.redirect("/");
})
//==========================================


//USER EDIT - - - - //Renders the page with the form to edit an account
router.get("/user/edit", isLoggedIn, (req, res)=> res.render("user/edit"))

//USER EDIT - - - - Processes the information from the 'User Edit' form
router.put("/user/:id/edit", isLoggedIn, (req, res)=>{
    User.findByIdAndUpdate(req.params.id, req.body.user, (errorUpdatingUser, updatedUser)=>{
        if(errorUpdatingUser)
            console.log("There has been an error updating the user... " + errorUpdatingUser.message)
        res.redirect("/courses")
    })
})

//Renders page for user to get a password recovery email
router.get("/user/forgot", (req, res)=> res.render("user/forgot"));

//Processes information from the forgot form
router.post("/user/forgot", (req, res)=>{
    async.waterfall([
        function(done){
            crypto.randomBytes(20, (err, buf)=>{
                var token = buf.toString("hex")
                done(err, token);
            });
        },
        function(token, done){
            User.findOne({email: req.body.email}, (errorFindingUser, foundUser)=>{
                //If we were not able to find a user with the given email
                if(!foundUser){
                    console.log("NO Accounts with that email: " + req.body.email);
                    return res.redirect('/user/forgot');
                }
    
                //if we did find the user
                foundUser.resetPasswordToken = token;
                foundUser.resetPasswordExpires = Date.now() + 3600000
    
                foundUser.save((err)=>{
                    done(err, token, foundUser);
                })
            })
        },
        function(token, foundUser, done){
            var mailData = {
                from: "What's My Grade <whatsmygradeapp@gmail.com>",
                to: foundUser.email,
                subject: 'Password Reset',
                text: "Hi There,\nYou're getting this email because you have requested to change your password on What's My Grade.\nClick the following link (or copy and paste it into your browser) to finish resetting your password." + 
                "\n\nhttp://192.168.1.156:8080/user/reset/" + token + "\n\n" +
                "This link will only work for the next hour. You can reply to this email with any questions or concerns you may have." + 
                "\n\nBest,\nWhat's My Grade"
              };

              mailgun.messages().send(mailData, function (error, body) {
                if(error){
                    console.log(error);
                    return;
                }
              console.log(body);
              res.redirect("/user/forgot")
            });
        }
    ],
    function(err){
        console.log("Got here")
        if(err){
            return console.log(err);
        }
        res.redirect("/user/forgot")
    }
    )
})

//Renders the page for the user to put in a new password
router.get("/user/reset/:token", (req, res)=>{
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (err, user)=>{
        if(!user){
            console.log("Password token is invalid or expired");
            return res.redirect("/user/forgot");
        }
        res.render("user/reset", {token: req.params.token});
    })
})

//Processes the new password
router.post("/reset/:token", (req, res)=>{
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (err, foundUser)=>{
        if(!user){
            console.log("Password token is invalid or expired");
            return res.redirect("back");
        }
        if(req.body.password === req.body.confirm){
            foundUser.setPassword(req.body.password, (err)=>{
                foundUser.resetPasswordExpires = undefined;
                foundUser.resetPasswordToken = undefined

                foundUser.save(err =>{
                    res.redirect("/courses");
                })
            })
        }
    })
})

//Deletes the user
router.delete("/user/:id/delete", (req, res)=>{
    User.findByIdAndDelete(req.params.id, (errorDeletingUser, deletedUser) =>{
        if(errorDeletingUser){
            console.log("Error deleting the user... " + errorDeletingUser.message);
        }
        res.redirect("/");
    })
})

//Gives other files access to these routes 
module.exports = router;

//A middleware that goes on routes that I only want LOGGED IN users to enter.
function isLoggedIn(req, res, next) {
    //If the user is not logged in, they will be redirected to the login in page
    if (req.isAuthenticated())
        return next();
    else
        res.redirect("/user/login");
}