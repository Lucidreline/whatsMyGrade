var mongoose = require("mongoose");
var mongooseLocalPassport = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    firstName: String,
    email:String,
    username: String,
    password: String,
    courses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        }
    ]
})


//Alows us to use passwords.. hashes them up or something like that so that the actual password isn't stored in the database
userSchema.plugin(mongooseLocalPassport);


module.exports = mongoose.model("User", userSchema);