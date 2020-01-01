//The app's dependencies... we are just requiring all of the dependancies
var methodOverride = require("method-override"), //Allows us to send PUT and DELETE actions from our forms
    bodyParser = require("body-parser"), //allows us to get information from the user's form
    flash = require("connect-flash"), //Gives us access to success and error messages for the user
    mongoose = require("mongoose"), // Lets us connect to our database
    passport = require("passport"), //Lets us hash the user's passwords
    express = require("express"), //Gives us access to almost everything here, all the routes and server listener
    app = express(); //Puts express into a variable called app which you can see everywhere

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
    app.set("view engine", "ejs"); //We have to tell the app to always render ejs files so that we dont have to keep putting .ejs after each file... Stay DRY amigos
    app.use(express.static("public")); //Tells the app where we are going to put assets like photos, stylesheets, scripts, etc.
    app.use(bodyParser.urlencoded({extended:true})); //Allows us to get information from forms
    app.use(methodOverride("_method")); //Allows us to be able to use PUT and DELETE routes

//Allows my app to use passport. This makes it possible to have secure passwords
app.use(passport.initialize());
app.use(passport.session())

app.use(flash()); //Tells the app to use flash

var User = require("./models/user"); //Gives this file access to the User model

//These contribute to having a user logged in and access to the signed in user.
    //This is useful if we want to, for example, display the user's name on the nav bar
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req, res, next){ //A middleware. before any page is loaded, it runs this method
    //This lets us access the current user's information.
    //We can use it to display the current users name or courses
    res.locals.loggedInUser = req.user; //lets us use the req.user variable from any page
    res.locals.error = req.flash("error")// Gives all pages access to the error flash
    res.locals.success = req.flash("success")// Gives all pages access to the success flash
    next(); //Starts the next middlewar in the route or if there isnt any more, it will call the call back function
})


var allRoutes = ["index", "user", "course", "grade"];
allRoutes.forEach(route => app.use(require("./routes/" + route))) //gets the route files that are refactored into different files

app.listen(process.env.PORT, process.env.IP , ()=> console.log("Server is ONLINE")); //Makes the server possible. Gives it a port and an IP adress if I give one.