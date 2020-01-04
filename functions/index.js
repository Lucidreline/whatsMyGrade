

module.exports = {
    showErrorAndRefresh: (req, res, errorMessage)=> {
        req.flash("error", errorMessage);
        res.redirect("back")
    }
}