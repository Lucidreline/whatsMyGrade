var mongoose = require("mongoose");

var categorySchema = new mongoose.Schema({
    name: String,
    percentWorth: Number,
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
})

module.exports = mongoose.model("Category", categorySchema);