let express = require("express"),
    router = express.Router(),
    functions = require("../middleware"),
    middleware = require("../middleware")

//models
let Category = require("../models/category"),
    Grade = require("../models/grade"),
    Course = require("../models/course")

//render the  edit page
router.get("/category/:id/edit", middleware.isLoggedIn, (req, res)=>{
    console.log("id we are getting: " + req.params.id)
    Category.findById(req.params.id, (errFindingCategory, foundCatgeory)=>{
        console.log("what we found: " + foundCatgeory)
        if(errFindingCategory){
            console.log("Error finding the category to edit: " + errFindingCategory.message);
            req.flash("error", errFindingCategory.message);
            return res.redirect("/courses");
        }
        Course.findById(foundCatgeory.course._id.toString(), (errorFindingCourse, foundCourse)=>{
            console.log(foundCourse)
            res.render("category/edit", {category: foundCatgeory, course: foundCourse});
        })
    })
})

//processes the edit information
router.put("/category/:id/edit", middleware.isLoggedIn, (req, res)=>{
    res.send("You want to edit")
})

//deletes the category
router.delete("/category/:id/delete", middleware.isLoggedIn, (req, res)=>{
    res.send("You want to delete")
})

module.exports = router