var mongoose = require("mongoose");

var courseSchema = new mongoose.Schema({
    name: String,
    color: String,
    percentage: Number,
    categories: [
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
        }
    ],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    grades: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Grade"
        }
    ]
})

module.exports = mongoose.model("Course", courseSchema);