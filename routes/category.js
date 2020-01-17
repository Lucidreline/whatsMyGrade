let express = require("express"),
    router = express.Router(),
    functions = require("../functions"),
    middleware = require("../middleware")

//models
let Category = require("../models/category"),
    Grade = require("../models/grade"),
    Course = require("../models/course")

//render the  edit page
router.get("/category/:id/edit", middleware.isLoggedIn, (req, res) => {
    Category.findById(req.params.id, (errFindingCategory, foundCatgeory) => {
        if (errFindingCategory) {
            req.flash("error", errFindingCategory.message);
            return res.redirect("/courses");
        }
        Course.findById(foundCatgeory.course._id.toString(), (errorFindingCourse, foundCourse) => {
            res.render("category/edit", { category: foundCatgeory, course: foundCourse });
        })
    })
})

//processes the edit information
router.put("/category/:id/edit", middleware.isLoggedIn, (req, res) => {
    Category.findById(req.params.id, (errorUpdatingCategory, foundCategory) => {
        foundCategory.name = req.body.category.name
        foundCategory.percentWorth = req.body.category.percentWorth
        foundCategory.color = req.body.category.color


        //lets find all the grades that are associated with this category and edit them
        Grade.find({ category: foundCategory._id }, (errorFindingGrades, foundGrades) => {
            foundGrades.forEach(async grade => {
                grade.categoryName = req.body.category.name;
                grade.categoryColor = req.body.category.color;
                grade.percentWorth = req.body.category.percentWorth;
                await functions.SaveObjectToDatabase(foundCategory)
                await functions.SaveObjectToDatabase(grade)

                Course.findById(foundCategory.course._id, async (errorFindingCourse, foundCourse) => {
                    try {
                        await refreshGradesAfterAddedPercentagesValue(foundCourse)
                    }
                    catch{
                        res.redirect("/courses/")
                    }
                    res.redirect("/courses/" + foundCategory.course._id)
                })



            })
        })
    })
})

//deletes the category
router.delete("/category/:id/delete", middleware.isLoggedIn, (req, res) => {
    try {
        Category.findByIdAndRemove(req.params.id, (errorDeletingCategory, deletedCategory) => {
            Grade.find({ category: deletedCategory._id }, (errorSearchingForGrades, gradesToDelete) => { //gets a list of all the grades that will be deleted because the DeleteMany method doesnt return that information
                Grade.deleteMany({ category: deletedCategory._id }, (errorFindingGrades, callBack) => { //deletes all the grades in the category
                    Course.findById(deletedCategory.course._id, (errorFindingCourse, foundCourse) => { //finds the course that the category belongs to


                        for (let i = 0; i < foundCourse.grades.length; i++) { // loops through all the grade IDs in the course
                            for (let j = 0; j < gradesToDelete.length; j++) { //loops through all the grades that will be deleted along with the category
                                if (foundCourse.grades[i].toString() == gradesToDelete[j]._id.toString()) //checks to see if the id in the course matches an id that will be deleted
                                    foundCourse.grades.splice(i, 1) //if it matches, the grade id will be removed from the course list since the actual grade was just deleted
                            }
                        }

                        
                        for (let i = 0; i < foundCourse.categories.length; i++) { //deletes the category out of the course
                            if (foundCourse.categories[i].toString() == deletedCategory._id.toString()) {
                                foundCourse.categories.splice(i, 1)
                                break; //breaks because once the category is found, it will not find another since IDs are unique
                            }
                        }
                        foundCourse.save((errorSavingCourse, savedCourse) => {
                            res.redirect("/courses/" + savedCourse._id)
                        })
                    })
                })
            })
        })
    }
    catch (errorWithCodeBlock) {
        console.log("ERROR DELETING CATEGORY " + errorWithCodeBlock)
        res.redirect("/courses")
    }
})

module.exports = router

function refreshGradesAfterAddedPercentagesValue(_course) {
    return new Promise((resolve, reject) => {
        try {
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