module.exports = {
    showErrorAndRefresh: (req, res, errorMessage)=> {
        req.flash("error", errorMessage);
        res.redirect("back")
    },

    SaveObjectsToDataBaseAndRedirect: async(_objectsToSave, _res, _redirectString) => {
        //takes in an array of objects to save. You can enter as many as 4 objects, if you enter less then 4 won't cause an error 
        Promise.all([SaveObjectToDatabase(_objectsToSave[0]), SaveObjectToDatabase(_objectsToSave[1]), SaveObjectToDatabase(_objectsToSave[2]), SaveObjectToDatabase(_objectsToSave[3])])
        //Catches any errors we get if something is not saved
        .catch((promisesError) => _res.redirect(_redirectString))
        //This will happen AFTER
            .then(async (values) => {
                await refreshGradesAfterAddedPercentagesValue(_objectsToSave[0]);
                
                _res.redirect(_redirectString)
            })
    },
        
    SaveObjectToDatabase: (_object) => {
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
    },
    
    refreshGradesAfterAddedPercentagesValue: (_course) => {
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
    },
    
    sumOfArray: (_arr) => {
        var sum = 0;
        for (var i = 0; i < _arr.length; i++)
        sum += _arr[i];
        
        return sum;
    },
    
    averageOfArray: (_arr) => {
        var sum = 0;
        for (var i = 0; i < _arr.length; i++)
        sum += _arr[i];
        
        return sum / _arr.length;
    }
}