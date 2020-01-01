var middlewareObj = {}; //creates an empty object

middlewareObj.isLoggedIn = (req, res, next)=>{ //Adds the function 'isLoggedIn' in the object
    //If the user is not logged in, they will be redirected to the login in page
    if (req.isAuthenticated())
        return next();
    else{
        req.flash("error", "Please log in first!")
        res.redirect("/user/login");
    }
}

module.exports = middlewareObj; //returns the object