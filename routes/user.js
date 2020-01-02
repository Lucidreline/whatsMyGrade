require("dotenv").config(); //gives us access to our .env file

var localStrategy = require("passport-local"), //Imports the pasports and express packages.
    middlware = require("../middleware"), //We should require middleware/index.js but since the file is called index, this line will automaticly look for an index to require
    passport = require("passport"), //Passport allows us to use user authentication.
    express = require("express"),
    router = express.Router()

//Used for password recovery
var api_key = process.env.MAILGUN_API_KEY,
    domain = process.env.MAILGUN_DOMAIN,
    mailgun = require('mailgun-js')({apiKey: api_key, domain: domain}),
    crypto = require("crypto"),
    async = require("async")

var User = require("../models/user"); //Gives this file access to the user model

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
            req.flash("error", "Oops, " + err.message)
            console.log("Error registering a new User: " + err.message);
            return res.render("User/registerLogin");
        }
        //Logs in the new user
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to your new account " + req.body.firstName + "!!!")
            res.redirect("/courses")
        })
    })
})

//Login ====================================
//Takes in the data from the login form
router.post("/user/login", function (req, res, next) {
    passport.authenticate("local",
      {
        successRedirect: "/courses", //If the password matches, the user is redirected to home
        failureRedirect: "/user/login", //If the user credentials are wrong, the page will refresh
        failureFlash: "Oops, either your username or password is incorrect",
        successFlash: "Welcome back, " + req.body.username + "!"
      })(req, res);
  });

//LOG OUT =================================
router.get("/user/logout", function(req, res){
    req.logOut();
    req.flash("success", "Successfuly logged out")
    res.redirect("/");
})

//USER EDIT - - - - //Renders the page with the form to edit an account
router.get("/user/edit", middlware.isLoggedIn, (req, res)=> res.render("user/edit"))

//USER EDIT - - - - Processes the information from the 'User Edit' form
router.put("/user/:id/edit", middlware.isLoggedIn, (req, res)=>{
    User.findByIdAndUpdate(req.params.id, req.body.user, (errorUpdatingUser, updatedUser)=>{
        if(errorUpdatingUser){
            req.flash("error", errorUpdatingUser.message)
            console.log("There has been an error updating the user... " + errorUpdatingUser.message)
        }
        req.flash("success", "Successfully updated your account!")
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
                    req.flash("error", "We don't have an account with that email.")
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
              req.flash("success", "A password recovery email has been sent to " + foundUser.email)
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
            req.flash("error", "Oops, the password token is invalid or expired.")
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
            req.flash("error", "Oops, the password token is invalid or expired.")
            return res.redirect("back");
        }
        if(req.body.password === req.body.confirm){
            foundUser.setPassword(req.body.password, (err)=>{
                foundUser.resetPasswordExpires = undefined;
                foundUser.resetPasswordToken = undefined

                foundUser.save(err =>{
                    passport.authenticate("local")(req, res, function(){ //loggs in the user
                        req.flash("success", "Password updated! Glad to have you back!")
                        res.redirect("/courses")
                    })
                })
            })
        }
    })
})

//Deletes the user
router.delete("/user/:id/delete", middlware.isLoggedIn, (req, res)=>{
    User.findByIdAndDelete(req.params.id, (errorDeletingUser, deletedUser) =>{
        if(errorDeletingUser){
            req.flash("error", "Oops, you're account was not succeffuly deleted.")
            console.log("Error deleting the user... " + errorDeletingUser.message);
        }
        else{
            req.flash("success", "Account deleted. Sorry to see you leave " + deletedUser.firstName + "...")
        }
        res.redirect("/");
    })
})

module.exports = router; //Gives other files access to these routes 