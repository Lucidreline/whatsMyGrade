const mongoose = require("mongoose");


var gradeSchema = new mongoose.Schema({
    name: String,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    possiblePoints: Number,
    pointsRecieved: Number,
    percentage: Number,
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    }
});

module.exports = mongoose.model("Grade", gradeSchema);