var mongoose = require("mongoose"); //Pull in the mongoose package

var categorySchema = new mongoose.Schema({ //Structures the data that categories will have
    name: String,
    color: String,
    percentWorth: Number, //This category is X% of your total grade
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