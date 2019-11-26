const express = require("express"),
    router = express.Router();

let Course = require("../models/course"),
    Grade = require("../models/grade");

//note that grade will not have its own show page, they will be displayed on the course show page

router.get("/courses/:id/grade/new", isLoggedIn, (req, res)=> {
    Course.findOne({_id: req.params.id}, (err, foundCourse)=>res.render("grade/new", {course: foundCourse}));
})

router.post("/courses/:id/grade/new", isLoggedIn, (req, res)=>{
    //lets first pull up the course
    Course.findOne({_id: req.params.id}, (err, foundCourse)=>{
        if(err)
            console.log("Could not find course with ID: " + req.params.id);
        else{
            //then create the grade in the call back
            Grade.create(req.body.grade, async (error, createdGrade)=>{
                if(error)
                    console.log('Was not able to create the grade');
                else{
                    //then push the grade into the course's grade list
                    foundCourse.grades.push(createdGrade);
                    //add the course's id to the grade aswell
                    createdGrade.course = foundCourse;
                    
                    //save both
                    foundCourse.save((err, savedCourse)=>{
                        createdGrade.save((error, savedGrade)=>{
                            res.redirect("/courses/" + foundCourse._id);
                        });
                    });
                    
                }
            })
        }
    })
    
    
    
    
})

module.exports = router;

//figure out how to factor this out cause I use this in the course routes aswell
function isLoggedIn(req, res, next){
    if(req.isAuthenticated())
        return next();
    else
        res.redirect("/user/login");
}