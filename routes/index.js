const express = require("express");
const router = express.Router();

let Grade = require("../models/grade");
let Course = require("../models/course");
let User = require("../models/user");


router.get("/", (req, res)=>{
    res.render("./index/homepage", {loggedInUser: req.user});
});


// router.get("/test", (req, res)=>{
    
//     User.findOne({username: "Manny"}, async (err, foundUser)=>{
//         if(err){
//             console.log("COuldnt find user: " + err);
//         }else{
//                 Course.findOne({_id: "5ddc06200b360c3c98f44d09"}, (err, foundCourse)=>{
//                     if(err){
//                         console.log("WHat seems to e the problem officer? ... " + err);
//                     }else{
//                         console.log("The new course: " + foundCourse + "\n");
//                         foundUser.courses.push(foundCourse);
//                         foundUser.save((err, savedUser)=>{
//                             console.log("\n\n My updated user: " + savedUser)
//                         })
//                     }
//                 })
//         }
//     })
// })

module.exports = router;