var mongoose = require("mongoose");

var courseSchema = new mongoose({
    name: String,
    color: String,
    assignmentCategories: [String],
    grades: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Grade"
        }
    ]
})

module.exports = mongoose.model("Course", courseSchema);