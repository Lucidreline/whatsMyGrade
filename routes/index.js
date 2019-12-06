//Gives us access to the express package and uses Router for the routes
var express = require("express"),
    router = express.Router();


//The home page route... renders the home page
router.get("/", (req, res)=>{
    res.render("./index/homepage", {loggedInUser: req.user});
});

//Gives other files access to these routes
module.exports = router;