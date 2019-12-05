//requires the mongoose package
const mongoose = require("mongoose");


var gradeSchema = new mongoose.Schema({
    name: String,
    //The category that the grade falls into. Ex. Exams, quizes, Assignments.
    category: {
        //Saves the categorie's Mongoose ID
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    pointsRecieved: Number,
    //The max ammount of points that can be recieved (not incuding extra credit)
    possiblePoints: Number,
    percentage: Number,
    
    // The course that the grade belongs to.
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    }
});

//Gives other files access to the grade's model.
module.exports = mongoose.model("Grade", gradeSchema);