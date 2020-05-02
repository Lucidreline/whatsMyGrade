var express = require('express'), //Brings in the express package
  router = express.Router(); //Gets Express's router, Just like how we used the variable name app insode of app.js

//loads the other models.
var Category = require('../models/category'),
  Course = require('../models/course'),
  Grade = require('../models/grade'),
  middlware = require('../middleware'), //We should require middleware/index.js but since the file is called index, this line will automaticly look for an index to require
  functions = require('../functions');

//Index page, lists all the courses created by the logged in user
router.get('/courses', middlware.isLoggedIn, async (req, res) => {
  Course.find({ author: req.user._id }, (err, foundCourses) => {
    //finds all the courses that are made by the author
    if (err) {
      //makes sure there is no error in doing so. If there is, the website will be redirected to the home page
      console.log('Error finding courses for user: ' + req.user);
      req.flash(
        'error',
        'Oops, we were not able to find your courses. ' + err.message
      );
      return res.redirect('/');
    }

    //written by adrianita Jimenez
    let myQuotes = [
      'Keep up the good work!',
      'The grind never stops',
      "Don't give up!",
      'You have a bright future ahead of you!',
      'The secret of getting ahead is getting started',
      "You miss 100% of the shots you don't take",
    ];
    var magicRandomNumber = Math.random() * myQuotes.length;

    magicRandomNumber = Math.floor(magicRandomNumber);

    var selectedQuote = myQuotes[magicRandomNumber];

    //if no error: Renders the index page and throws in the list of found courses for the ejs file to use
    res.render('course/index', {
      courseList: foundCourses,
      quote: selectedQuote,
    });
  });
});

//Renders the form to create a new course
router.get('/courses/new', middlware.isLoggedIn, (req, res) =>
  res.render('course/new')
);

//Recieves the data that was entered in the 'New Course' form
router.post('/courses/new', middlware.isLoggedIn, (req, res) => {
  if (req.body.course.name.trim().length < 1)
    return functions.showErrorAndRefresh(
      req,
      res,
      'Oops, name must be at least one character'
    );

  if (req.body.course.color.trim() == '')
    return functions.showErrorAndRefresh(
      req,
      res,
      'Oops, pick a color before moving on'
    );

  //creates the course using the forms data
  Course.create(req.body.course, (err, createdCourse) => {
    if (err) {
      console.log('Error creating: ' + req.body.course);
      req.flash('error', 'Oops, ' + err.message);
      return res.redirect('/courses');
    }
    createdCourse.author = req.user;
    createdCourse.percentage = 0;
    req.user.courses.push(createdCourse);
    req.user.courseColors.push({
      courseID: createdCourse,
      color: createdCourse.color,
    });

    //Here im saving both the user and course. I placed the redirect inside of the
    // nested call back so that the app wont redirect before both the course and user are saved
    createdCourse.save((error, savedCourse) => {
      req.user.save((errors, saveduser) => {
        req.flash('success', 'Successfully created ' + createdCourse.name);
        res.redirect('/courses/' + createdCourse._id);
      });
    });
  });
});

//Show page, more detailed page of a course
router.get('/courses/:id', middlware.isLoggedIn, async (req, res) => {
  //uses the URL to get an ID and find the course with that matching ID
  Course.findById(req.params.id, (err, foundCourse) => {
    //if the course is not found, the website is redirected to the course index page
    if (err) {
      console.log('Can not find the course with the id: ' + req.params.id);
      req.flash(
        'error',
        'Oops, we were not able to find your course. ' + err.message
      );
      return res.redirect('/courses');
    }
    //if there is no error: The grades inside of the found course will be searched for
    Grade.find({ course: foundCourse._id }, async (error, foundGrades) => {
      //If no grades if found, we will redirect back to the course page
      if (error) {
        console.log('Can not find grades in the course ' + foundCourse);
        req.flash(
          'error',
          "Oops, we were not able to find your course's grades. " +
            error.message
        );
        return res.redirect('/courses');
      }
      Category.find(
        { course: foundCourse._id },
        async (foundCategoryError, foundCategories) => {
          if (foundCategoryError) {
            console.log('error while finding categories');
            req.flash(
              'error',
              "Oops, we were not able to find your course's Categories. " +
                foundCategoryError.message
            );
            return res.redirect('/courses');
          }
          gradesList = await Grade.find({ course: foundCourse._id });
          if (foundCourse.categoryOrganizer) {
          } else {
          }
          res.render('course/show', {
            course: foundCourse,
            grades: catSort(gradesList),
            categories: foundCategories,
          });
        }
      );
    });
  });
});

//Renders the edit page
router.get('/courses/:id/edit', middlware.isLoggedIn, (req, res) => {
  Course.findById(req.params.id, async (errorFindingCourse, foundCourse) => {
    //Find the course that you want to edit from the ID that is in the url
    if (errorFindingCourse || !foundCourse) {
      console.log('Error Finding: ' + foundCourse);
      req.flash(
        'error',
        'Oops, we were not able to load the edit page. ' +
          errorFindingCourse.message
      );
      return res.redirect('/courses');
    }
    res.render('course/edit', { course: foundCourse }); //Loads the course edit field with the found course's information (in order to have the inputs pre filled)
  });
});

//Edits the course
router.put('/courses/:id/edit', middlware.isLoggedIn, (req, res) => {
  if (req.body.course.name.trim().length < 1)
    return functions.showErrorAndRefresh(
      req,
      res,
      'Oops, name must be at least one character'
    );

  if (req.body.course.color.trim() == '')
    return functions.showErrorAndRefresh(
      req,
      res,
      'Oops, pick a color before moving on'
    );

  Course.findByIdAndUpdate(
    req.params.id,
    req.body.course,
    (errorUpdatingCourse, updatedCourse) => {
      //Finds the course by its ID
      if (errorUpdatingCourse || !updatedCourse) {
        //if there is an error finding the course or if it can not be
        console.log('Can not update course');
        req.flash(
          'error',
          'Oops, we were not able to update your course. ' +
            errorUpdatingCourse.message
        );
        return res.redirect('/courses');
      }

      //The following code not relating to the course, it is just to change the color on the course page background
      for (let i = 0; i < req.user.courseColors.length; i++) {
        //change color in the users course color list
        if (
          req.user.courseColors[i].courseID.toString() ==
          updatedCourse._id.toString()
        ) {
          req.user.courseColors[i].color = req.body.course.color;
          break;
        }
      }
      req.user.save((errorSaving, savedUser) => {
        //Saves the user so that the new color can be saved on the course colo rlist
        if (errorSaving) {
          console.log('Could not save user after updating course! :(');
          return res.redirect('/course');
        }
        req.flash(
          'success',
          req.body.course.name + ' has successfully updated'
        );
        res.redirect('/courses/' + updatedCourse._id);
      });
    }
  );
});

//Deletes the course!
router.delete('/courses/:id/delete', middlware.isLoggedIn, (req, res) => {
  Course.findByIdAndRemove(
    req.params.id,
    (errordeletingCourse, deletedCourse) => {
      //Deletes the course from the database
      if (errordeletingCourse) {
        console.log('Unable to delete course. ' + errordeletingCourse.message);
        req.flash(
          'error',
          'Oops, we were not able to delete your course. ' +
            errorUpdatingCourse.message
        );
        return res.redirect('/courses/');
      }
      for (let i = 0; i < req.user.courseColors.length; i++) {
        //goes through the colors from the courses page background and deletes the one that belonged to this course
        if (
          req.user.courseColors[i].courseID.toString() ==
          deletedCourse._id.toString()
        ) {
          req.user.courseColors.splice(i, 1);
          break;
        }
      }

      Grade.deleteMany(
        { course: deletedCourse._id },
        (errorDeletingGrades, deletedGrades) => {
          //Deletes all grades that were in the course
          if (errorDeletingGrades) {
            console.log(
              'was able to delete the course but not the grades within'
            );
            return res.redirect('/courses/');
          }
          Category.deleteMany(
            { course: deletedCourse._id },
            (errorDeletingCategories, deletedcategories) => {
              //Deletes all categories inside of all the grades in the course
              if (errorDeletingCategories) {
                console.log(
                  'The grades were deleted but the categories were not'
                );
                return res.redirect('/courses/');
              }
              req.user.save((errorSaving, savedUser) => {
                // Saves these changes to the user (The user's course color list was changed)
                if (errorSaving) {
                  console.log(
                    'Could not save the user with the deleted course! :('
                  );
                } else {
                  req.flash(
                    'success',
                    'Successfully deleted ' + deletedCourse.name
                  );
                }
                res.redirect('/courses/');
              });
            }
          );
        }
      );
    }
  );
});

module.exports = router; //Allows other files to use the routes in this file

function catSort(grades) {
  // change name to grade
  // change node to grade
  categoryLists = [];
  exists = false;

  grades.forEach(grade => {
    exists = false;
    for (let i = 0; i < categoryLists.length; i++) {
      if (grade.categoryName == categoryLists[i].cat) {
        categoryLists[i].listOfNodes.push(grade);
        exists = true;
        break;
      }
    }
    if (!exists) {
      categoryLists.push({
        cat: grade.categoryName,
        listOfNodes: [grade],
      });
    }
  });

  masterList = [];
  categoryLists.forEach(category => {
    category.listOfNodes.forEach(grade => {
      masterList.push(grade);
    });
  });
  return masterList;
}
