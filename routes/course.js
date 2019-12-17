//Brings in the express package
var express = require("express"),
    //Gets Express's router, Just like how we used the variable name app insode of app.js
    router = express.Router();

//loads in the course and Grade model.
var Course = require("../models/course"),
    Grade = require("../models/grade");

//Index page, lists all the courses created by the logged in user
router.get("/courses", isLoggedIn, async (req, res)=>{
    //finds all the courses that are made by the author
    Course.find({author: req.user._id}, (err, foundCourses)=>{
        //makes sure there is no error in doing so. If there is, the website will be redirected to the home page
        if(err){
            console.log("Error finding courses for user: " + req.user);
            res.redirect("/");
            return;
        }
        //if no error: Renders the index page and throws in the list of found courses for the ejs file to use
        res.render("course/index", {courseList: foundCourses}) 
    })
})

//Renders the form to create a new course
router.get("/courses/new", isLoggedIn, (req, res)=> res.render("course/new"))

//Recieves the data that was entered in the 'New Course' form
router.post("/courses/new", isLoggedIn, (req, res)=>{
    //creates the course using the forms data
    Course.create(req.body.course, (err, createdCourse)=>{
        if(err){
            console.log("Error creating: " + req.body.course);
            res.redirect("/courses");
            return;
        }
        createdCourse.author = req.user;
        createdCourse.percentage = 0;
        req.user.courses.push(createdCourse);
        req.user.courseColors.push({courseID: createdCourse, color: createdCourse.color});

        //Here im saving both the user and course. I placed the redirect inside of the 
        // nested call back so that the app wont redirect before both the course and user are saved
        createdCourse.save((error, savedCourse)=>{
            req.user.save((errors, saveduser)=>res.redirect("/courses/" + createdCourse._id)) 
        })
    })
})

//Show page, more detailed page of a course
router.get("/courses/:id", isLoggedIn, (req, res)=>{
    //uses the URL to get an ID and find the course with that matching ID
    Course.findById(req.params.id, (err, foundCourse)=>{
        //if the course is not found, the website is redirected to the course index page
        if(err){
            console.log("Can not find the course with the id: " + req.params.id);
            res.redirect("/courses");
            return;
        }
        //if there is no error: The grades inside of the found course will be searched for
        Grade.find({course: foundCourse._id}, (error, foundGrades)=>{
            //If no grades if found, we will redirect back to the course page
            if(error){
                console.log("Can not find grades in the course " + foundCourse)
                res.redirect("/courses");
                return
            }
            res.render("course/show", {course: foundCourse, grades: foundGrades});
        })
    })
})


//Allows other files to use the routes in this file
// I will only use it in app.js
module.exports = router;

//A middleware that goes on routes that I only want LOGGED IN users to enter.
function isLoggedIn(req, res, next){
    //If the user is not logged in, they will be redirected to the login in page
    if(req.isAuthenticated())
        return next();
    else
        res.redirect("/user/login");
}