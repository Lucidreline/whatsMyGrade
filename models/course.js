var mongoose = require("mongoose");

var courseSchema = new mongoose.Schema({
    name: String,
    color: String,
    percentage: Number,

    //list of categories that this Course contains
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
        }
    ],
    //The id of the person that created the course
    //Used to only display the courses that you created and no other user's courses
    author: {
        //Doing this type/ref is how I can save just the mongoose ID
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    //All of the grade IDs in the course
    grades: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Grade"
        }
    ]
})

//Allows my other files to have access to the Course Model
module.exports = mongoose.model("Course", courseSchema);