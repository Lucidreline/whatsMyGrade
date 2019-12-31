var mongoose = require("mongoose");

var courseSchema = new mongoose.Schema({
    name: String,
    color: String,
    percentage: Number,
    categories: [{ //list of categories that this Course contains
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
        }
    ],
    author: { //Used to only display the courses that you created and no other user's courses
        //Doing this type/ref is how I can save just the mongoose ID
        type: mongoose.Schema.Types.ObjectId, //The id of the person that created the course
        ref: "User"
    },
    grades: [ //All of the grade IDs in the course
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Grade"
        }
    ]
})

//Allows my other files to have access to the Course Model
module.exports = mongoose.model("Course", courseSchema);