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
router.get("/courses/:id/grade/new", isLoggedIn, (req, res) => {
    //Finds the ONE course by using the ID inside of the url
    Course.findOne({ _id: req.params.id }, (foundCourseError, foundCourse) => {
        if (foundCourseError) {
            console.log("Was not able to find course!");
            res.redirect("/courses");
            return;
        }


        //Finds a list of Categories that are associated with the course that was just found
        Category.find({ course: foundCourse._id }, (foundCategoryError, foundCategories) => {
            if (foundCategoryError) {
                console.log("error while finding categories");
                res.redirect("/courses");
                return;
            }
            res.render("grade/new", { course: foundCourse, categories: foundCategories })
        })

    });
})

//GRADE CREATE - - - Processes the information from the 'Grade Create' form
router.post("/courses/:id/grade/new", isLoggedIn, (req, res) => {
    //Pulls the One course that is found in the url
    Course.findOne({ _id: req.params.id }, (foundCourseError, foundCourse) => {
        if (foundCourseError) {
            console.log("Could not find course with ID: " + req.params.id);
            res.redirect("/courses");
            return;
        }
        else {
            //After the course is found, the grade is created using the data from the form
            Grade.create(req.body.grade, async (createdGradeError, createdGrade) => {
                if (createdGradeError) {
                    console.log('Was not able to create the grade');
                    res.redirect("/courses");
                }
                else {
                    //Pushes the grade into the course's grade list
                    foundCourse.grades.push(createdGrade);

                    //adds the course's id to the grade
                    createdGrade.course = foundCourse;

                    //add the grade percentage:
                    createdGrade.percentage = (createdGrade.pointsRecieved / createdGrade.possiblePoints) * 100;



                    //next we check if the user wants a new category
                    if (req.body.exsistingCategory.name == "New") {
                        //creating a new category
                        Category.create(req.body.newCategory, (createdCategoryError, createdCategory) => {
                            if (createdCategoryError) {
                                console.log("Could not create category")
                                res.redirect("/courses/" + foundCourse._id);
                                return
                            }
                            //we give the new category a course ID to stay in
                            createdCategory.course = foundCourse;

                            //Push the newly created grade's ID into the categories list of grades
                            createdCategory.gradesAssociatedWith.push(createdGrade);

                            //We give the new grade the category
                            createdGrade.category = createdCategory;

                            createdGrade.percentWorth = createdCategory.percentWorth;

                            //and we push the new category into the courses list of categories
                            foundCourse.categories.push(createdCategory);

                            SaveObjectsToDataBaseAndRedirect([foundCourse, createdCategory, createdGrade], res, "/courses/" + foundCourse._id)

                            // //we save all 3 (category, grade, and course)
                            // foundCourse.save((err, savedCourse)=>{
                            //     //The redirect is in the nested call backs so that it won't redirect until the category, grade, and course is saved.
                            //     createdGrade.save((error, savedGrade)=>{
                            //         if(error) console.log(error)
                            //         createdCategory.save((ERROR, savedGrade)=>{
                            //             res.redirect("/courses/" + foundCourse._id)
                            //         });
                            //     });
                            // });
                        })
                    } else {
                        //if we are using an pre-exsisting category

                        //we recieve the pre-exsisting category by looking it up using BOTH the name and course
                        Category.findOne({ name: req.body.exsistingCategory.name, course: foundCourse._id }, (FoundCategoryError, foundCategory) => {
                            if (FoundCategoryError) {
                                console.log("Could not find category")
                                res.redirect("/courses/" + foundCourse._id);
                                return
                            }

                            //We put the newly created grade in the category's list of grades
                            foundCategory.gradesAssociatedWith.push(createdGrade);
                            //we put the pre-exsisting category into the grade
                            createdGrade.category = foundCategory;
                            createdGrade.percentWorth = foundCategory.percentWorth

                            SaveObjectsToDataBaseAndRedirect([foundCourse, foundCategory, createdGrade], res, "/courses/" + foundCourse._id)

                            //save the grade, course, and course
                            // foundCourse.save((err, savedCourse)=>{
                            //     createdGrade.save((error, savedGrade)=>{
                            //         foundCategory.save((ERROR, savedGrade)=>{
                            //             res.redirect("/courses/" + foundCourse._id);
                            //         })
                            //     });
                            // });
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
function isLoggedIn(req, res, next) {
    //If the user is not logged in, they will be redirected to the login in page
    if (req.isAuthenticated())
        return next();
    else
        res.redirect("/user/login");
}

function CalculateCoursePercentage(_course) {
    return new Promise((resolve, redirect) => {

        var gradePercentsForCategory = [];
        var allCategoryPercentages = [];
        var categoriesAverageScore = 0;
        var currentGradesPercentageWorth = 0;
        var allPercentWorths = [];

        //takes in a course object
        Grade.find({ course: _course._id }, (gradeFindingError, foundGrades) => {
            if (gradeFindingError) {
                console.log("There is an error finding the grades");
                return;
            }

            _course.categories.forEach((categoryID) => {
                //for some reason the first grade of the course nis never read the first time so this will temp fix that
                if(foundGrades.length == 1){
                    currentGradesPercentageWorth = foundGrades[0].percentWorth / 100;
                    gradePercentsForCategory.push(foundGrades[0].percentage / 100)
                }

                foundGrades.forEach((grade) => {
                    if (grade.category.toString() == categoryID.toString()) {
                        currentGradesPercentageWorth = grade.percentWorth / 100;
                        gradePercentsForCategory.push(grade.percentage / 100)
                        console.log(grade)
                    }
                })
                categoriesAverageScore = averageOfArray(gradePercentsForCategory)  * currentGradesPercentageWorth;
                allCategoryPercentages.push(categoriesAverageScore);
                allPercentWorths.push(currentGradesPercentageWorth);

                gradePercentsForCategory = [];
                categoriesAverageScore = [];
                console.log("\n")
            })

            console.log("YOUR PERCENT SUM: " + sumOfArray(allCategoryPercentages))
            console.log("YOUR PERCENT TOTAL: " + sumOfArray(allPercentWorths));
            var percent = (sumOfArray(allCategoryPercentages) / sumOfArray(allPercentWorths) * 100);
            percent = percent.toFixed(2);
            console.log("YOUR PERCENT: " + percent + " %");
            
            resolve(percent);
        })
    })

}

function sumOfArray(_arr){
    var sum = 0;
    for(var i = 0; i < _arr.length; i++)
        sum += _arr[i];

    return sum  ;
}
function averageOfArray(_arr){
    var sum = 0;
    for(var i = 0; i < _arr.length; i++)
        sum += _arr[i];

    return sum/_arr.length;
}

async function SaveObjectsToDataBaseAndRedirect(_objectsToSave, _res, _redirectString) {
    //takes in an array of objects to save. You can enter as many as 4 objects, if you enter less then 4 won't cause an error 
    Promise.all([SaveObjectToDatabase(_objectsToSave[0]), SaveObjectToDatabase(_objectsToSave[1]), SaveObjectToDatabase(_objectsToSave[2]), SaveObjectToDatabase(_objectsToSave[3])])
        //Catches any errors we get if something is not saved
        .catch((promisesError) => _res.redirect(_redirectString))
        //This will happen AFTER
        .then(async(values)=>{
            console.log("This is the redirection!");
            _objectsToSave[0].percentage = await CalculateCoursePercentage(_objectsToSave[0])
            _objectsToSave[0].save((resaveCourseErr, savedCourse)=>{
                if(resaveCourseErr){
                    _res.redirect("/");
                }
                _res.redirect(_redirectString)
            });   
        })
}

function SaveObjectToDatabase(_object) {
    //Only run this code if there is an object here to save
    if (_object) {
        //creates a promise in order to allow all objects to save before the code moves on
        return new Promise((resolve, reject) => {
            //Saves the currently saved object
            _object.save((errorSavingObject, savedObject) => {
                //call back function for the saved object. Stops the code if the object wasn't successfuly saved
                if (errorSavingObject)
                    reject(errorSavingObject);
                else
                    resolve();
                //The line above resolves the promise if there was no errors
            })
        })
    }
}