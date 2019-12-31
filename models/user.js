var mongoose = require("mongoose");
var mongooseLocalPassport = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    firstName: String,
    email:{type: String, unique: true, required: true},
    username: {type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    password: String, //The actual password is not saved here. The password is hashed by mongoose passport.
    courses: [     //All the courses associated with the user.
        {
            type: mongoose.Schema.Types.ObjectId, //the Course's mongoose ID
            ref: "Course"
        }
    ],
    courseColors: [{
        courseID: {
            type: mongoose.Schema.Types.ObjectId, //the Course's mongoose ID
            ref: "Course"
        },
        color: String
    }]
})

//Alows us to use passwords.. hashes them up or something like that so that the actual password isn't stored in the database
userSchema.plugin(mongooseLocalPassport);

//Gives other files access to User Model
module.exports = mongoose.model("User", userSchema);