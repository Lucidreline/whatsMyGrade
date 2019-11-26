var express = require("express");
var router = express.Router();
var passport = require("passport");
var localStrategy = require("passport-local")

let User = require("../models/user");

passport.use(new localStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


router.get("/user/login", (req, res)=>{
    res.render("./user/registerLogin");
});


router.post("/user/register", (req, res)=>{
    User.register(new User({
        // firstName: req.body.firstName,
        // email: req.body.email,
        username: req.body.username,

    }), req.body.password, function(err, createdUser){
        if(err){
            console.log("Error registering a new User: " + err.message);
            return res.render("User/registerLogin");
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/");
        })
    })
})

//Login ====================================
router.post("/user/login", passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/user/login"
}));
//==========================================

//LOG OUT =================================
router.get("/user/logout", function(req, res){
    req.logOut();
    res.redirect("/");
})
//==========================================

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }else{
        res.redirect("/user/register");
    }
}

module.exports = router;