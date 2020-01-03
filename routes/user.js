require("dotenv").config(); //gives us access to our .env file

var localStrategy = require("passport-local"), //Imports the pasports and express packages.
    middlware = require("../middleware"), //We should require middleware/index.js but since the file is called index, this line will automaticly look for an index to require
    passport = require("passport"), //Passport allows us to use user authentication.
    express = require("express"),
    router = express.Router()

//Used for password recovery

var sendGridMail = require('@sendgrid/mail'),
    // api_key = process.env.MAILGUN_API_KEY,
    // domain = process.env.MAILGUN_DOMAIN,
    // mailgun = require('mailgun-js')({apiKey: api_key, domain: domain}),
    crypto = require("crypto"),
    async = require("async")

sendGridMail.setApiKey("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")

var User = require("../models/user"); //Gives this file access to the user model

//Not sure what these do exactly, but I know they contribute to the user's logging in
passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Renders the login/register form
router.get("/user/login", (req, res) => res.render("./user/registerLogin"));

//Takes in the data from the register form
router.post("/user/register", (req, res) => {
    //Makes sure the username is valid
    if (req.body.firstName.trim().length < 1)
        return showErrorAndRefresh(req, res, "Your first name must be at least 1 character")

    //Makes sure the username is valid
    var newUsername = req.body.username.toLowerCase().trim();
    if (newUsername.length < 5)
        return showErrorAndRefresh(req, res, "Your username must be atleast 6 characters")

    //Makes sure the password is secure
    if (req.body.password.trim().length < 7)
        return showErrorAndRefresh(req, res, "Your password must be atleast 8 characters")

    if (req.body.password.search(/[a-z]/) < 0)
        return showErrorAndRefresh(req, res, "Your password must contain at least one lowercase letter")

    if (req.body.password.search(/[A-Z]/) < 0)
        return showErrorAndRefresh(req, res, "Your password must contain at least one uppercase letter")

    if (req.body.password.search(/[0-9]/) < 0)
        return showErrorAndRefresh(req, res, "Your password must contain at least one number")

    //ensures that the email is unique
    User.find({ email: req.body.email }, (err, foundUsers) => {
        if (foundUsers.length != 0) {
            return showErrorAndRefresh(req, res, "That email is already taken")
        }
        else {
            //Creates a new user and gives it the data
            User.register(new User({
                firstName: req.body.firstName,
                email: req.body.email,
                username: newUsername,

            }), req.body.password, function (err, createdUser) {
                if (err) {
                    req.flash("error", "Oops, " + err.message)
                    console.log("Error registering a new User: " + err.message);
                    return res.redirect("/user/login");
                }
                passport.authenticate("local")(req, res, function () { //Logs in the new user
                    req.flash("success", "Welcome to your new account " + req.body.firstName + "!!!")
                    res.redirect("/courses")
                })
            })
        }
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
router.get("/user/logout", function (req, res) {
    req.logOut();
    req.flash("success", "Successfuly logged out")
    res.redirect("/");
})

//USER EDIT - - - - //Renders the page with the form to edit an account
router.get("/user/edit", middlware.isLoggedIn, (req, res) => res.render("user/edit"))

//USER EDIT - - - - Processes the information from the 'User Edit' form
router.put("/user/:id/edit", middlware.isLoggedIn, (req, res) => {
    //Makes sure the username is valid
    if (req.body.user.firstName.trim().length < 1)
        return showErrorAndRefresh(req, res, "Your first name must be at least 1 character")

    //Makes sure the username is valid
    var newUsername = req.body.user.username.toLowerCase().trim();
    if (newUsername.length < 5)
        return showErrorAndRefresh(req, res, "Your username must be atleast 6 characters")

    User.find({ email: req.body.user.email }, (err, foundUsers) => {
        if (foundUsers.length == 1) {
            if (foundUsers[0].email == req.user.email) {
                User.findByIdAndUpdate(req.params.id, req.body.user, (errorUpdatingUser, updatedUser) => {
                    if (errorUpdatingUser) {
                        showErrorAndRefresh(req, res, errorUpdatingUser.message)
                        console.log("There has been an error updating the user... " + errorUpdatingUser.message)
                    }
                    req.flash("success", "Updated your account! Sign in again")
                    res.redirect("/user/login") 
                })
            } else {
                return showErrorAndRefresh(req, res, "That email is already taken")
            }
        } else if (foundUsers.length == 0) {
            User.findByIdAndUpdate(req.params.id, req.body.user, (errorUpdatingUser, updatedUser) => {
                if (errorUpdatingUser) {
                    showErrorAndRefresh(req, res, errorUpdatingUser.message)
                    console.log("There has been an error updating the user... " + errorUpdatingUser.message)
                }
                req.flash("success", "Updated your account! Sign in again")
                res.redirect("/user/login")                 
            })
        } else {
            return showErrorAndRefresh(req, res, "That email is already taken")
        }
    })
})

//Renders page for user to get a password recovery email
router.get("/user/forgot", (req, res) => res.render("user/forgot"));

//Processes information from the forgot form
router.post("/user/forgot", (req, res) => {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, (err, buf) => {
                var token = buf.toString("hex")
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({ email: req.body.email }, (errorFindingUser, foundUser) => {
                //If we were not able to find a user with the given email
                if (!foundUser) {
                    console.log("NO Accounts with that email: " + req.body.email);
                    req.flash("error", "We don't have an account with that email.")
                    return res.redirect('/user/forgot');
                }

                //if we did find the user
                foundUser.resetPasswordToken = token;
                foundUser.resetPasswordExpires = Date.now() + 3600000

                foundUser.save((err) => {
                    done(err, token, foundUser);
                })
            })
        },
        function (token, foundUser, done) {


            const mailData = {
                to: foundUser.email,
                from: 'whatsmygradeapp@gmail.com',
                subject: 'Password Reset',
                text: "Hi There,\nYou're getting this email because you have requested to change your password on What's My Grade.\nClick the following link (or copy and paste it into your browser) to finish resetting your password." +
                    "\n\nhttp://192.168.1.156:8080/user/reset/" + token + "\n\n" +
                    "This link will only work for the next hour. You can reply to this email with any questions or concerns you may have." +
                    "\n\nBest,\nWhat's My Grade",
            };
            try {
                sendGridMail.send(mailData);
                req.flash("success", "A password recovery email has been sent to " + foundUser.email)
                res.redirect("/user/forgot")
            } catch (sendingEmailError) {
                console.log(sendingEmailError)
            }

            // var mailData = {
            //     from: "What's My Grade <whatsmygradeapp@gmail.com>",
            //     to: foundUser.email,
            //     subject: 'Password Reset',
            //     text: "Hi There,\nYou're getting this email because you have requested to change your password on What's My Grade.\nClick the following link (or copy and paste it into your browser) to finish resetting your password." + 
            //     "\n\nhttp://192.168.1.156:8080/user/reset/" + token + "\n\n" +
            //     "This link will only work for the next hour. You can reply to this email with any questions or concerns you may have." + 
            //     "\n\nBest,\nWhat's My Grade"
            //   };

            //   mailgun.messages().send(mailData, function (error, body) {
            //     if(error){
            //         console.log(error);
            //         return;
            //     }
            //   console.log(body);
            //   req.flash("success", "A password recovery email has been sent to " + foundUser.email)
            //   res.redirect("/user/forgot")
            // });
        }
    ],
        function (err) {
            console.log("Got here")
            if (err) {
                return console.log(err);
            }
            res.redirect("/user/forgot")
        }
    )
})

//Renders the page for the user to put in a new password
router.get("/user/reset/:token", (req, res) => {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
        if (!user) {
            console.log("Password token is invalid or expired");
            req.flash("error", "Oops, the password token is invalid or expired.")
            return res.redirect("/user/forgot");
        }
        res.render("user/reset", { token: req.params.token });
    })
})

//Processes the new password
router.post("/reset/:token", (req, res) => {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, foundUser) => {
        if (!foundUser) {
            console.log("Password token is invalid or expired");
            req.flash("error", "Oops, the password token is invalid or expired.")
            return res.redirect("back");
        }

        if (req.body.password === req.body.confirm) {
            //Makes sure the password is secure
            if (req.body.password.trim().length < 7)
                return showErrorAndRefresh(req, res, "Your password must be atleast 8 characters")

            if (req.body.password.search(/[a-z]/) < 0)
                return showErrorAndRefresh(req, res, "Your password must contain at least one lowercase letter")

            if (req.body.password.search(/[A-Z]/) < 0)
                return showErrorAndRefresh(req, res, "Your password must contain at least one uppercase letter")

            if (req.body.password.search(/[0-9]/) < 0)
                return showErrorAndRefresh(req, res, "Your password must contain at least one number")


            foundUser.setPassword(req.body.password, (err) => {
                if (err) {
                    console.log("err: " + err.message)
                }
                foundUser.resetPasswordExpires = undefined;
                foundUser.resetPasswordToken = undefined

                foundUser.save(error => {
                    if (err) {
                        console.log("err: " + error.message)
                    }
                    req.login(foundUser, err => {
                        req.flash("success", "Password updated! Glad to have you back!")
                        res.redirect("/courses")
                    });
                })
            })
        } else {
            req.flash("error", "Oops, Passwords did not match.")
            res.redirect("/user/reset/" + req.params.token)
        }
    })
})

//Deletes the user
router.delete("/user/:id/delete", middlware.isLoggedIn, (req, res) => {
    User.findByIdAndDelete(req.params.id, (errorDeletingUser, deletedUser) => {
        if (errorDeletingUser) {
            req.flash("error", "Oops, you're account was not succeffuly deleted.")
            console.log("Error deleting the user... " + errorDeletingUser.message);
        }
        else {
            req.flash("success", "Account deleted. Sorry to see you leave " + deletedUser.firstName + "...")
        }
        res.redirect("/");
    })
})

module.exports = router; //Gives other files access to these routes 

function showErrorAndRefresh(req, res, errorMessage) {
    req.flash("error", errorMessage);
    res.redirect("back")
}