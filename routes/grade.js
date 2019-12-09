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

                            createdGrade.categoryColor = createdCategory.color;

                            SaveObjectsToDataBaseAndRedirect([foundCourse, createdCategory, createdGrade], res, "/courses/" + foundCourse._id, createdGrade)

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

                            createdGrade.categoryColor = foundCategory.color;

                            SaveObjectsToDataBaseAndRedirect([foundCourse, foundCategory, createdGrade], res, "/courses/" + foundCourse._id, createdGrade)
                        })
                    }
                }
            })
        }
    })
})


//Grade EDIT - - - - Renders the edit form to edit a grade
router.get("/courses/:CourseID/grade/:gradeID/edit", isLoggedIn, (req, res) => {
    Course.findOne({ _id: req.params.CourseID }, (foundCourseError, foundCourse) => {
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
            Grade.findById(req.params.gradeID, (gradeFindingError, foundGrade) => {
                if (gradeFindingError) {
                    console.log("error while finding grade to edit");
                    res.redirect("/courses");
                    return;
                }
                res.render("grade/edit", { course: foundCourse, categories: foundCategories, grade: foundGrade });
            })

        })

    });
})

//GRADE EDIT - - - - Processes the information from the 'Grade Edit' form
router.put("/courses/:CourseID/grade/:gradeID/edit", (req, res) => {

    Grade.findById(req.params.gradeID, req.body.grade, async (errorUpdatingGrade, updatedGrade) => {
        updatedGrade.name = req.body.grade.name
        updatedGrade.pointsRecieved = req.body.grade.pointsRecieved
        updatedGrade.possiblePoints = req.body.grade.possiblePoints

        await SaveObjectToDatabase(updatedGrade)

        Course.findById(req.params.CourseID, (errorFindingCourse, foundCourse) => {

            //Pushes the grade into the course's grade list
            foundCourse.grades.push(updatedGrade);

            //adds the course's id to the grade
            updatedGrade.course = foundCourse;

            //add the grade percentage:
            updatedGrade.percentage = (updatedGrade.pointsRecieved / updatedGrade.possiblePoints) * 100;

            if (errorFindingCourse) {
                console.log("Could not find course")
                res.redirect("/courses");
                return
            }
            if (req.body.exsistingCategory.name == "New") {
                Category.create(req.body.newCategory, (createdCategoryError, createdCategory) => {
                    if (createdCategoryError) {
                        console.log("Could not create category")
                        res.redirect("/courses/" + foundCourse._id);
                        return
                    }
                    //we give the new category a course ID to stay in
                    createdCategory.course = foundCourse;

                    //Push the newly created grade's ID into the categories list of grades
                    createdCategory.gradesAssociatedWith.push(updatedGrade);

                    //We give the new grade the category
                    updatedGrade.category = createdCategory;

                    updatedGrade.percentWorth = createdCategory.percentWorth;

                    //and we push the new category into the courses list of categories
                    foundCourse.categories.push(createdCategory);

                    updatedGrade.categoryColor = createdCategory.color;

                    SaveObjectsToDataBaseAndRedirect([foundCourse, createdCategory, updatedGrade], res, "/courses/" + foundCourse._id)
                })
            } else {
                //we recieve the pre-exsisting category by looking it up using BOTH the name and course
                Category.findOne({ name: req.body.exsistingCategory.name, course: foundCourse._id }, (FoundCategoryError, foundCategory) => {
                    if (FoundCategoryError) {
                        console.log("Could not find category")
                        res.redirect("/courses/" + foundCourse._id);
                        return
                    }

                    //We put the newly created grade in the category's list of grades
                    foundCategory.gradesAssociatedWith.push(updatedGrade);
                    //we put the pre-exsisting category into the grade
                    updatedGrade.category = foundCategory;


                    updatedGrade.percentWorth = foundCategory.percentWorth

                    updatedGrade.categoryColor = foundCategory.color;

                    updatedGrade.percentage = (updatedGrade.pointsRecieved / updatedGrade.possiblePoints) * 100;
                    updatedGrade.save((x, y)=>{
                        SaveObjectsToDataBaseAndRedirect([foundCourse, foundCategory, updatedGrade], res, "/courses/" + foundCourse._id)
                    })
                    

                    
                })
            }
        })
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

function sumOfArray(_arr) {
    var sum = 0;
    for (var i = 0; i < _arr.length; i++)
        sum += _arr[i];

    return sum;
}
function averageOfArray(_arr) {
    var sum = 0;
    for (var i = 0; i < _arr.length; i++)
        sum += _arr[i];

    return sum / _arr.length;
}

async function SaveObjectsToDataBaseAndRedirect(_objectsToSave, _res, _redirectString) {
    //takes in an array of objects to save. You can enter as many as 4 objects, if you enter less then 4 won't cause an error 
    Promise.all([SaveObjectToDatabase(_objectsToSave[0]), SaveObjectToDatabase(_objectsToSave[1]), SaveObjectToDatabase(_objectsToSave[2]), SaveObjectToDatabase(_objectsToSave[3])])
        //Catches any errors we get if something is not saved
        .catch((promisesError) => _res.redirect(_redirectString))
        //This will happen AFTER
        .then(async (values) => {
            await refreshGradesAfterAddedPercentagesValue(_objectsToSave[0]);

            _res.redirect(_redirectString)
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

function refreshGradesAfterAddedPercentagesValue(_course) {
    return new Promise((resolve, reject) => {
        Grade.find({ course: _course._id }, async (errorFindingGrades, foundGrades) => {
            if (errorFindingGrades)
                reject("Coudnt find grades in the refresh");

            else {
                var listOfcalculatedPercentages = [],
                    listOfUsedCategories = [],
                    listOfPercentWorths = [],
                    newCat;
                currentPercentage = 0;

                foundGrades.forEach(async (grade) => {
                    newCat = true;

                    listOfUsedCategories.forEach((usedCategory) => {
                        if (usedCategory.id.toString() == grade.category.toString()) {
                            newCat = false
                            usedCategory.percents.push(grade.percentage);
                        }
                    })

                    if (newCat) {
                        listOfUsedCategories.push({
                            id: grade.category,
                            worth: grade.percentWorth,
                            percents: [grade.percentage]
                        })
                    }


                    listOfUsedCategories.forEach((usedCategory) => {
                        listOfcalculatedPercentages.push((averageOfArray(usedCategory.percents)) * (usedCategory.worth))
                        listOfPercentWorths.push(usedCategory.worth);
                    })


                    currentPercentage = (sumOfArray(listOfcalculatedPercentages) / (sumOfArray(listOfPercentWorths)))
                    currentPercentage = (sumOfArray(listOfcalculatedPercentages) / (sumOfArray(listOfPercentWorths)))
                    listOfcalculatedPercentages = [];
                    listOfPercentWorths = [];
                    grade.coursePercentAfterThisGradeIsadded = currentPercentage;
                    await SaveObjectToDatabase(grade);

                })
                _course.percentage = currentPercentage;
                await SaveObjectToDatabase(_course);
                resolve();
            }
        })

    })
}