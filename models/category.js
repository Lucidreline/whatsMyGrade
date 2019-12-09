//Pull in the mongoose package
var mongoose = require("mongoose");

//Structures the data that categories will have
var categorySchema = new mongoose.Schema({
    name: String,
    color: String,

    //These 2 wont actually save data, but they will help calculate the coursePercentage
    tempGradePercentagesHolder: [Number],
    tempCalculatedePercentageHolder: Number,

    //This category is X% of your total grade
    percentWorth: Number,
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    gradesAssociatedWith:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "grades"
        }
    ]
})

//Gives other files access to this category structure
module.exports = mongoose.model("Category", categorySchema);