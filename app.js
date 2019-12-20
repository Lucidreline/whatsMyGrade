//The app's dependencies... we are just requiring all of the dependancies
var methodOverride = require("method-override"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    express = require("express"),
    app = express();

//Allows us to use our environmental variables. These are stored in /.env
require("dotenv").config();

//This allows a user to stay logged in until they sign out or leave 
// thus preventing the user from having to log in every time they switch pages.
app.use(require("express-session")({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}))

//Connects to the mongoose database
mongoose.connect(process.env.MONGOOSE_LINK, {
    useNewUrlParser: true,
    useUnifiedTopology: true 
}).then(()=>{
    console.log("Successfully connected to our DataBase Son!");
}).catch(err =>{
    console.log("Database Error: " + err.message);
})

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

//Allows my app to use passport. This makes it possible to have secure passwords
app.use(passport.initialize());
app.use(passport.session())

//Gives this file access to the User model
var User = require("./models/user");

//Contributes to having a user logged in and access to the signed in user.
    //This is useful if we want to, for example, display the user's name on the nav bar
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//A middleware. before any page is loaded, it runs this method
app.use(function(req, res, next){
    //lets us use the req.user variable from any page
        //This lets us access the current user's information.
        //We can use it to display the current users name or courses
    res.locals.loggedInUser = req.user;
    next();
})

//gets the route files that are refactored into different files
var allRoutes = ["index", "user", "course", "grade"];
allRoutes.forEach(route => app.use(require("./routes/" + route)))

//Makes the server possible. Gives it a port and an IP adress if I give one.
app.listen(process.env.PORT, process.env.IP , ()=> console.log("Server is ONLINE"));