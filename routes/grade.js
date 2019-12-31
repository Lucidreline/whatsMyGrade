var express = require("express"), //Brings in the express package
    router = express.Router(); //Uses router just like how we used app in app.js

//Gives this file access to the other models
var Course = require("../models/course"),
    Grade = require("../models/grade"),
    Category = require("../models/category");

// * NOTE * Grade will not have its own index/show page, they will be displayed on the course show page

// * NOTE * Grades will not have its own create page because you can create a grade from it's courses show page

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
                    if (req.body.exsistingCategory.name == "New") { //if the user is creating a new category
                        
                        Category.create(req.body.newCategory, (createdCategoryError, createdCategory) => {
                            if (createdCategoryError) {
                                console.log("Could not create category")
                                res.redirect("/courses/" + foundCourse._id);
                                return
                            }
                            createdCategory.course = foundCourse; //we give the new category a course ID to stay in
                            createdCategory.gradesAssociatedWith.push(createdGrade); //Push the newly created grade's ID into the categories list of grades
                            createdGrade.category     = createdCategory; //We give the new grade the category ID
                            createdGrade.categoryName = createdCategory.name; //We give the new grade the category name
                            createdGrade.percentWorth = createdCategory.percentWorth; //The new grade inherits the percentage worth from the category

                            foundCourse.categories.push(createdCategory); //and we push the new category into the courses list of categories
                            createdGrade.categoryColor = createdCategory.color; //New grade inherits the color from the category

                            SaveObjectsToDataBaseAndRedirect([foundCourse, createdCategory, createdGrade], res, "/courses/" + foundCourse._id, createdGrade)
                        })
                    } else { //if we are using an pre-exsisting category
                
                        //we recieve the pre-exsisting category by looking it up using BOTH the name and course
                        Category.findOne({ name: req.body.exsistingCategory.name, course: foundCourse._id }, (FoundCategoryError, foundCategory) => {
                            if (FoundCategoryError) {
                                console.log("Could not find category")
                                res.redirect("/courses/" + foundCourse._id);
                                return
                            }

                            foundCategory.gradesAssociatedWith.push(createdGrade); //We put the newly created grade in the category's list of grades
                            
                            createdGrade.category     = foundCategory; //we put the pre-exsisting category into the grade
                            createdGrade.categoryName = foundCategory.name; //the new grade gets the name of the pre-exsisting category
                            createdGrade.percentWorth = foundCategory.percentWorth //The new grade inherits the percentage worth from the pre-exsisting category
                            createdGrade.categoryColor = foundCategory.color; //The new grade inherits the color from the pre-exsisting category

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
                // load the grade edit page along with information about which course and category the grade belongs to
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
                    updatedGrade.categoryName = createdCategory.name;

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
                    updatedGrade.categoryName = foundCategory.name;


                    updatedGrade.percentWorth = foundCategory.percentWorth

                    updatedGrade.categoryColor = foundCategory.color;

                    updatedGrade.percentage = (updatedGrade.pointsRecieved / updatedGrade.possiblePoints) * 100;
                    updatedGrade.save((x, y) => {
                        SaveObjectsToDataBaseAndRedirect([foundCourse, foundCategory, updatedGrade], res, "/courses/" + foundCourse._id)
                    })



                })
            }
        })
    })
})

//Grade Delete - - - - Removes the current grade from the database along with its ID from the course and category
router.delete("/courses/:CourseID/grade/:gradeID/delete", (req, res) => {
    try {
        Grade.findByIdAndRemove(req.params.gradeID, (errorDestroyingGrade, destroyedGrade) => {
            Course.findById(req.params.CourseID, (errorFindingCourse, foundCourse) => {
                for (var i = 0; i < foundCourse.grades.length; i++) {
                    if (destroyedGrade._id.toString() == foundCourse.grades[i].toString())
                        foundCourse.grades.splice(i, 1);
                }

                Category.findById(destroyedGrade.category, async (errorFindingCategory, foundCategory) => {
                    for (var i = 0; i < foundCategory.gradesAssociatedWith.length; i++) {
                        if (destroyedGrade._id.toString() == foundCategory.gradesAssociatedWith[i].toString())
                            foundCategory.gradesAssociatedWith.splice(i, 1);
                    }
                    SaveObjectsToDataBaseAndRedirect([foundCourse, foundCategory], res, "/courses/" + req.params.CourseID)
                })
            })
        })
    } catch (error) {
        console.log("Error: " + error);
        res.redirect("/courses/" + req.params.courseID);
    }
})

//Allows other files to use the routes in this file
// I will only use it in app.js
module.exports = router;

// ======== FUNCTIONS =========
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
        try {
                    //gets a list of all the grades in the course

            Grade.find({ course: _course._id }, async (errorFindingGrades, foundGrades) => {

                //arrays that I will use to calculate the percentage
                var listOfcalculatedPercentages = [],
                    listOfUsedCategories = [],
                    listOfPercentWorths = [],
                    isNewCategory;

                currentPercentage = 0;

                //goes through every grade
                foundGrades.forEach(async (grade) => {
                    isNewCategory = true;

                    listOfUsedCategories.forEach((usedCategory) => {
                        //checks to see if a category matches the grade
                        if (usedCategory.id.toString() == grade.category.toString()) {
                            //lets the app know that I will not be creating a new category.
                            isNewCategory = false
                            //Adds this grades score percentage to the list of scores in this category
                            usedCategory.percents.push(grade.percentage);
                        }
                    })

                    //this happens if the courses has a category that has not been seen in this loop
                    if (isNewCategory) {
                        //since this category has not been seen before, it jus pushes a new category in the list initializing the object with the category, percentage worth, and a 1 element list with the grades score percentage 
                        listOfUsedCategories.push({
                            id: grade.category,
                            worth: grade.percentWorth,
                            percents: [grade.percentage]
                        })
                    }

                    //Goes through the list of categories that have already been used by grades so far and calculates the average grade per category and multiplies them by how much they are worth
                    listOfUsedCategories.forEach((usedCategory) => {
                        listOfcalculatedPercentages.push((averageOfArray(usedCategory.percents)) * (usedCategory.worth))
                        listOfPercentWorths.push(usedCategory.worth);
                    })

                    //Calculates the grade at this point in time. Each time this is looped through, it calculates the percent taking to account one more grade then it previously did until it reaches the last grade
                    currentPercentage = (sumOfArray(listOfcalculatedPercentages) / (sumOfArray(listOfPercentWorths)))
                    
                    //empties the list so things wont be repeated. 
                    //the only thing that is not dumped is the list of new categories
                    listOfcalculatedPercentages = [];
                    listOfPercentWorths = [];
                    grade.coursePercentAfterThisGradeIsadded = currentPercentage;
                    await SaveObjectToDatabase(grade);

                })
                //this gives the course a percentage based on ALL the enabled grades in it
                    //Enabled grades will be part of a future feature where some grades can be disabled due to special cases such as the professor drops the lowest 3 quizes etc.
                _course.percentage = currentPercentage;
                await SaveObjectToDatabase(_course);
                resolve();

            })
        }
        catch (caughtError) {
            reject(caughtError);
        }
    })
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
//A middleware that goes on routes that I only want LOGGED IN users to enter.
function isLoggedIn(req, res, next) {
    //If the user is not logged in, they will be redirected to the login in page
    if (req.isAuthenticated())
        return next();
    else
        res.redirect("/user/login");
}