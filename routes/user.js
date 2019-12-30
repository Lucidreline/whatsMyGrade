//Imports the pasports and express packages.
    //Passport allows us to use user authentication.
var localStrategy = require("passport-local"),
    passport = require("passport"),
    express = require("express"),
    router = express.Router()

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
router.get("/user/forgot", isLoggedIn, (req, res)=> {

});

//Renders the page for the user to put in a new password


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