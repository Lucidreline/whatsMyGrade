const express = require("express"),
    router = express.Router();

let Course = require("../models/course")

router.get("/courses", isLoggedIn, (req, res)=>{
    let coursesList = []
    req.user.courses.forEach(courseId => {
        Course.findOne({_id: courseId}, (err, foundCourse)=>{
            if(err)
                console.log("Could not find course with the following ID: " + courseId);
            else{
                coursesList.push(foundCourse);
            }
        })
    });
    res.render("course/index", {courseList: coursesList})
})


router.get("/courses/new", isLoggedIn, (req, res)=> res.render("course/new"))


router.post("/courses/new", isLoggedIn, (req, res)=>{
    Course.create(req.body.course, (err, createdCourse)=>{
        if(err)
            console.log("Error creating: " + req.body.course);
        else{
            createdCourse.author = req.user;
            req.user.courses.push(createdCourse);
            //Here im saving both the user and course. I could use async here probably but for now this is a quick fix
            createdCourse.save((error, savedCourse)=>{
                req.user.save((errors, saveduser)=>res.redirect("/courses")) 
            })
        }
    })
})

module.exports = router;

function isLoggedIn(req, res, next){
    if(req.isAuthenticated())
        return next();
    else
        res.redirect("/user/login");
}