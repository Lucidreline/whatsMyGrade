const mongoose = require("mongoose");


var gradeSchema = new mongoose.Schema({
    name: String,
    category: String,
    possiblePoints: Number,
    pointsRecieved: Number
});

module.exports = mongoose.model("Grade", gradeSchema);