const express = require("express"),
    router = express.Router();

//loads in the course and Grade model.
let Course = require("../models/course"),
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

router.get("/courses/new", isLoggedIn, (req, res)=> res.render("course/new"))


router.post("/courses/new", isLoggedIn, (req, res)=>{
    Course.create(req.body.course, (err, createdCourse)=>{
        if(err){
            console.log("Error creating: " + req.body.course);
            res.redirect("/courses");
            return;
        }
        
        createdCourse.author = req.user;
        req.user.courses.push(createdCourse);
        //Here im saving both the user and course. I could use async here probably but for now this is a quick fix
        //i didnt error check because im a savage
        createdCourse.save((error, savedCourse)=>{
            req.user.save((errors, saveduser)=>res.redirect("/courses")) 
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



module.exports = router;

function isLoggedIn(req, res, next){
    if(req.isAuthenticated())
        return next();
    else
        res.redirect("/user/login");
}