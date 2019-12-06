//Brings in the express package
var express = require("express"),
    //Uses router just like how we used app in app.js
    router = express.Router();

//Gives this file access to the Course, grade, and category model
var Course = require("../models/course"),
    Grade = require("../models/grade"),
    Category = require("../models/category");

//note that grade will not have its own index/show page, they will be displayed on the course show page

//GRADE CREATE - - - - Renders the form to create a new grade
router.get("/courses/:id/grade/new", isLoggedIn, (req, res)=> {
    //Finds the ONE course by using the ID inside of the url
    Course.findOne({_id: req.params.id}, (foundCourseError, foundCourse)=>{
        if(foundCourseError){
            console.log("Was not able to find course!");
            res.redirect("/courses");
            return;
        }
        //Finds a list of Categories that are associated with the course that was just found
        Category.find({course: foundCourse._id}, (foundCategoryError, foundCategories)=>{
            if(foundCategoryError){
                console.log("error while finding categories");
                res.redirect("/courses");
                return;
            }
            res.render("grade/new", {course: foundCourse, categories: foundCategories})
        })
        
    });
})

//GRADE CREATE - - - Processes the information from the 'Grade Create' form
router.post("/courses/:id/grade/new", isLoggedIn, (req, res)=>{
    //Pulls the One course that is found in the url
    Course.findOne({_id: req.params.id}, (foundCourseError, foundCourse)=>{
        if(foundCourseError){
            console.log("Could not find course with ID: " + req.params.id);
            res.redirect("/courses");
            return;
        } 
        else{
            //After the course is found, the grade is created using the data from the form
            Grade.create(req.body.grade, async (createdGradeError, createdGrade)=>{
                if(createdGradeError){
                    console.log('Was not able to create the grade');
                    res.redirect("/courses");
                }
                else{
                    //Pushes the grade into the course's grade list
                    foundCourse.grades.push(createdGrade);

                    //adds the course's id to the grade
                    createdGrade.course = foundCourse;

                    //add the grade percentage:
                    createdGrade.percentage = (createdGrade.possiblePoints / createdGrade.pointsRecieved) * 100
    
                    //next we check if the user wants a new category
                    if(req.body.exsistingCategory.name == "New"){
                        //creating a new category
                        Category.create(req.body.newCategory, (createdCategoryError, createdCategory)=>{
                            if(createdCategoryError){
                                console.log("Could not create category")
                                res.redirect("/courses/" + foundCourse._id);  
                                return
                            }
                            //we give the new category a course ID to stay in
                            createdCategory.course = foundCourse;

                            //Push the newly created grade's ID into the categories list of grades
                            createdCategory.gradesAssociatedWith.push(createdGrade);

                            //We give the new grade the category
                            createdGrade.category = createdCategory.name;

                            //and we push the new category into the courses list of categories
                            foundCourse.categories.push(createdCategory);

                            //we save all 3 (category, grade, and course)
                            foundCourse.save((err, savedCourse)=>{
                                //The redirect is in the nested call backs so that it won't redirect until the category, grade, and course is saved.
                                createdGrade.save((error, savedGrade)=>{
                                    createdCategory.save((ERROR, savedGrade)=> res.redirect("/courses/" + foundCourse._id));
                                });
                            });
                        })
                    }else{
                        //if we are using an pre-exsisting category

                        //we recieve the pre-exsisting category by looking it up using BOTH the name and course
                        Category.findOne({name: req.body.exsistingCategory.name, course: foundCourse._id }, (FoundCategoryError, foundCategory)=>{
                            if(FoundCategoryError){
                                console.log("Could not find category")
                                res.redirect("/courses/" + foundCourse._id);  
                                return
                            }
                            
                            //We put the newly created grade in the category's list of grades
                            foundCategory.gradesAssociatedWith.push(createdGrade);
                            //we put the pre-exsisting category into the grade
                            createdGrade.category = foundCategory;
                            //save the grade, course, and course
                            foundCourse.save((err, savedCourse)=>{
                                createdGrade.save((error, savedGrade)=>{
                                    foundCategory.save((ERROR, savedGrade)=>{
                                        res.redirect("/courses/" + foundCourse._id);
                                    })
                                });
                            });
                        })
                    } 
                }
            })
        }
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


function CalculateCoursePercentage (_course){

}