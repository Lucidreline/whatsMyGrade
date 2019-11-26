const express = require("express");
const router = express.Router();


router.get("/", (req, res)=>{
    res.render("./index/homepage", {loggedInUser: req.user});
});

router.get("/test", (req, res)=>{
    console.log(req.user)
    res.send("please@")
})


module.exports = router;