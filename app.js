//The app's dependencies
const passportLocalMongoose = require("passport-local-mongoose"),
    methodOverride = require("method-override"),
    localStrategy = require("passport-local"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    express = require("express"),
    app = express();

//Allows us to use our environmental variables
require("dotenv").config();

app.use(require("express-session")({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}))



//Lets connect to that database foo
mongoose.connect(process.env.MONGOOSE_LINK, {useNewUrlParser: true, useUnifiedTopology: true })

//Lets config this app.. jazz it up a bit you know?
    //We have to tell the app to always render ejs files so that we
    //dont have to keep putting .ejs after each file... Stay DRY amigos
    app.set("view engine", "ejs");

    //Tells the app where we are going to put assets like photos, stylesheets, scripts, etc.
    app.use(express.static("public"));

    //Allows us to get information from forms
    app.use(bodyParser.urlencoded({extended:true}));

    //Allows us to be able to use PUT and DELETE routes
    app.use(methodOverride("_method"));


//Gives my app passport which is auth: passwords
app.use(passport.initialize());
app.use(passport.session())

var User = require("./models/user");
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.loggedInUser = req.user;
    next();
})


//gets the routes that are refactored into different files
let indexRoutes = require("./routes/index"),
    userRoutes = require("./routes/user")


//Uses the refactored routes
app.use(indexRoutes);
app.use(userRoutes);


app.listen(process.env.PORT, ()=> console.log("Server is ONLINE"));