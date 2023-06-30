var middlewareObj = {}

middlewareObj.isDoctorLoggedIn = (req, res, next) => {
    if(req.isAuthenticated() && req.user.designation === "doctor"){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/doctors/signin");
}

middlewareObj.isPatientLoggedIn = (req, res, next) => {
    if(req.isAuthenticated() && req.user.designation === "patient"){
        return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/patients/signin");
}


module.exports = middlewareObj;