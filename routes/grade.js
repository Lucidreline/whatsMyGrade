const express = require("express"),
    router = express.Router();

let Course = require("../models/course"),
    Grade = require("../models/grade"),
    Category = require("../models/category");

//note that grade will not have its own index/show page, they will be displayed on the course show page

router.get("/courses/:id/grade/new", isLoggedIn, (req, res)=> {
    Course.findOne({_id: req.params.id}, (err, foundCourse)=>{
        if(err){
            console.log("Was not able to find course!");
            res.redirect("/courses");
            return;
        }
        Category.find({course: foundCourse._id}, (error, foundCategories)=>{
            if(error){
                console.log("error while finding categories");
                res.redirect("/courses");
                return;
            }
            res.render("grade/new", {course: foundCourse, categories: foundCategories})
        })
        
    });
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

                    //add the grade percentage:
                    createdGrade.percentage = (createdGrade.possiblePoints / createdGrade.pointsRecieved) * 100
    
                    //next we check if the user wants a new category
                    if(req.body.exsistingCategory.name == "New"){
                        //creating a new category
                        Category.create(req.body.newCategory, (errorsito, createdCategory)=>{
                            if(errorsito){
                                console.log("Could not create category")
                                res.redirect("/courses/" + foundCourse._id);  
                                return
                            }
                            //we give the new category a course ID to stay in
                            createdCategory.course = foundCourse;
                            //We give the new grade the category
                            createdGrade.category = createdCategory.name;
                            //and we push the new category into the courses list of categories
                            foundCourse.categories.push(createdCategory)
                            //we save all 3 (category, grade, and course)
                            foundCourse.save((err, savedCourse)=>{
                                createdGrade.save((error, savedGrade)=>{
                                    createdCategory.save((ERROR, savedGrade)=>{
                                        res.redirect("/courses/" + foundCourse._id);
                                    })
                                });
                            });
                        })
                    }else{
                        //using an old category
                        //we put the old category into the grade
                        createdGrade.category = req.body.exsistingCategory.name;
                        //save both grade and course
                        foundCourse.save((err, savedCourse)=>{
                            createdGrade.save((error, savedGrade)=>{
                                res.redirect("/courses/" + foundCourse._id);
                            });
                        });
                    } 
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