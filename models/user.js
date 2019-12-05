var mongoose = require("mongoose");
var mongooseLocalPassport = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    firstName: String,
    email:String,
    username: String,

    //The actual password is not saved here. The password is hashed by mongoose passport.
    password: String,
    //All the courses associated with the user.
    courses: [
        {
            //the Course's mongoose ID
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        }
    ]
})


//Alows us to use passwords.. hashes them up or something like that so that the actual password isn't stored in the database
userSchema.plugin(mongooseLocalPassport);

//Gives other files access to User Model
module.exports = mongoose.model("User", userSchema);