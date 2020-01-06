//requires the mongoose package
const mongoose = require("mongoose");


var gradeSchema = new mongoose.Schema({
    name: {type: String, required: true}, //The category that the grade falls into. Ex. Exams, quizes, Assignments.
    category: { //Saves the categorie's Mongoose ID
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    categoryName: String,
    pointsRecieved: {type: Number, required: true},
    possiblePoints: {type: Number, required: true}, //The max ammount of points that can be recieved (not incuding extra credit)
    percentWorth: Number,
    percentage: Number,
    coursePercentAfterThisGradeIsadded: Number, //After this grade was added, the course grade percentage changed to this
    categoryColor: String,
    course: { // The course that the grade belongs to.
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    }
});

//Gives other files access to the grade's model.
module.exports = mongoose.model("Grade", gradeSchema);