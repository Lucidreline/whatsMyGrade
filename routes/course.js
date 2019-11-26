const express = require("express"),
    router = express.Router();

let Course = require("../models/course")

router.get("/courses", isLoggedIn, async (req, res)=>{
    let courses = await populateCourseList(req);
    res.render("course/index", {courseList: courses}) 
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

router.get("/courses/:id", isLoggedIn, (req, res)=>{
    Course.findOne({_id: req.params.id}, (err, foundCourse)=>{
        res.render("course/show", {course: foundCourse});
    })
})

module.exports = router;

function populateCourseList(request){
    let coursesList = []
    return new Promise((resolve, reject)=>{
        for (let i = 0; i < request.user.courses.length; i++) {
            Course.findOne({_id: request.user.courses[i]}, (err, foundCourse)=>{
                if(err)
                    reject("Could not find course with the following ID: " + courseId);
                else{
                    console.log("Found course: " + foundCourse)
                    coursesList.push(foundCourse);
                }
                if(i + 1 == request.user.courses.length){
                    console.log("all done")
                    resolve(coursesList)
                }
            })
            
        }
    })
}

function isLoggedIn(req, res, next){
    if(req.isAuthenticated())
        return next();
    else
        res.redirect("/user/login");
}