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

//Gives other files access to these routes 
module.exports = router;