const express = require("express");
const router = express.Router();

var user = require("../models/user")

router.get("/", (req, res)=> res.render("./index/homepage"));

module.exports = router;