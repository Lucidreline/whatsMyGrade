const mongoose = require("mongoose");


var gradeSchema = new mongoose.Schema({
    name: String,
    category: String,
    possiblePoints: Number,
    pointsRecieved: Number,
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course"
    }
});

module.exports = mongoose.model("Grade", gradeSchema);