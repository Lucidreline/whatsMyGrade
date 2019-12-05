var mongoose = require("mongoose");

var categorySchema = new mongoose.Schema({
    name: String,
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

module.exports = mongoose.model("Category", categorySchema);