const express = require("express"),
router  = express.Router(),
mongoose = require('mongoose'),
passport = require('passport'),
multer = require('multer'),
path = require('path'),
fs = require('fs'),
flash = require("connect-flash"),
Doctors = require('../models/doctors'),
Patients = require('../models/patients'),
Consultations = require('../models/consultation'),
middleware = require('../middleware');


// ============================================== StorageEngine for Multer =============================================== //
const storage = multer.diskStorage({
    destination: './public/uploads/patients',
    filename: (req, file, cb) => {
        cb(null, file.fieldname +'-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 3000000
    },
    fileFilter: (req, file, callback) => {
        var ext = path.extname(file.originalname);
        if(ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
            req.fileValidationError = 'goes wrong on the mimetype';
            return callback(null, false, new Error('goes wrong on the mimetype'));
            // return callback(new Error('Only Text files are allowed'))
        }
        callback(null, true)
    }
}).single('profilePicture');


// ============================================== Routes =============================================== //

router.get('/patients/index', middleware.isPatientLoggedIn, (req, res) => {
    Doctors.find({}, (err, doctors) => {
        if(err) throw err;
        res.render('patients/index', {doctors: doctors});
    })
}); 

// ============================================== Authentication routes =============================================== //

router.get('/patients/signup', (req, res) => {
    res.render('patients/signup');
});

router.post('/patients/signup', (req, res) => {

    upload(req, res, (err) => {
        if(err){
            console.log(err);
        } else {
            var query = {$or:[{phoneNumber: req.body.phoneNumber}, {email: req.body.email}]};
            Patients.findOne(query, (err, found) => {
                if(found) {
                    var pathToPic = `public/uploads/patients/${req.file.filename}`; // Deleting the pic uploaded if err occurs
                    try {
                        fs.unlinkSync(pathToPic);
                    } catch (error) {
                        console.log(error);
                    }
                    req.flash('error', 'Email ID or Phone Number is already registered');
                    return res.redirect('/patients/signup');
                } else if (req.body.password != req.body.cpassword) {
                    var pathToPic = `public/uploads/patients/${req.file.filename}`;
                    try {
                        fs.unlinkSync(pathToPic);
                    } catch (error) {
                        console.log(error);
                    }
                    req.flash('error', 'Passwords don\'t match');
                    return res.redirect('/patients/signup');
                } else {
                    var newUser = new Patients({
                        name: req.body.name,
                        email: req.body.email,
                        designation: 'patient',
                        age: req.body.age,
                        profilePicture: req.file.filename,
                        phoneNumber: req.body.phoneNumber,
                        historySurgery: req.body.historySurgery.split(','),
                        historyIllness: req.body.historyIllness.split(','),
                        password: req.body.password
                    });
                    Patients.createUser(newUser, (err, user) => {
                        if (err) throw err;
                    });
                    req.flash('success', 'Successfully Signed Up');
                    res.redirect('/patients/signin');
                }
            })
        }
    });
});

router.get('/patients/signin', (req, res) => {
    res.render('patients/signin');
});

router.post('/patients/signin', passport.authenticate('patientLocal', {
    successRedirect: '/patients/index',
    failureRedirect: '/patients/signin',
    failureFlash: true,
    successFlash: 'Welcome'
}), function(req, res) { 
});


//  ============================================== Profile routes ============================================= //

router.get('/patients/profile/:id', middleware.isPatientLoggedIn , (req, res) => {
    Patients.findById(req.params.id, (err, patient) => {
        res.render('patients/profile', {patient: patient});
    });
})

router.get('/patients/profile/:id/update',middleware.isPatientLoggedIn , (req, res) => {
    Patients.findById(req.params.id, (err, patient) => {
        res.render('patients/update', {patient: patient});
    });
});

router.put('/patients/profile/:id/update',middleware.isPatientLoggedIn , (req, res) => {
    upload(req, res, (err) => {
        if(req.file){
            Patients.findById(req.params.id, (err, foundPatient) => {
                var pathToPic = `public/uploads/patients/${foundPatient.profilePicture}`;
                try {
                fs.unlinkSync(pathToPic);
                } catch (error) {
                console.log(error);
                }
            });
            var newPat = {
                profilePicture: req.file.filename,
                name: req.body.name,
                email: req.body.email,
                age: req.body.age,
                historySurgery: req.body.historySurgery,
                historyIllness: req.body.historyIllness

            }
            Patients.findByIdAndUpdate(req.params.id, newPat, (err, newpatient) => {
                if(err){
                    console.log(err);
                } else {
                    req.flash('success', 'Successfully Updated Profile');
                    res.redirect('/patients/profile/'+req.params.id);
                }
            });
        } else {
            var newPat = {
                name: req.body.name,
                email: req.body.email,
                age: req.body.age,
                historySurgery: req.body.historySurgery,
                historyIllness: req.body.historyIllness
            }
            Patients.findByIdAndUpdate(req.params.id, newPat, (err, newpatient) => {
                if(err){
                    console.log(err);
                } else {
                    req.flash('success', 'Successfully Updated Profile');
                    res.redirect('/patients/profile/'+req.params.id);
                }
            });
        }
    });
});


router.get('/patients/profile/:id/changepassword', middleware.isPatientLoggedIn, (req, res) => {
    Patients.findById(req.params.id, (err, pat) => {
        if(err){
            console.log(err);
        } else {
            res.render('patients/changepassword', {patient: pat});
        }
    });
});

router.put('/patients/profile/:id/changepassword', middleware.isPatientLoggedIn, (req, res) => {
    if(req.body.password != req.body.cpassword){
        req.flash('error', 'Password & Confirm Password don\'t match');
        return res.redirect('back');
    } else {
        Patients.findById(req.params.id, (err, pat) => {
            pat.password = req.body.password;
            Patients.resetPassword(pat, (err, foundPatient) => {
                if(err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Password Changed Successfully')
                    return res.redirect('/patients/profile/'+req.params.id);
                }
            });
        });
    }
});


//  ============================================== Consultation routes ============================================= //

router.get('/patients/:pid/consult/:did',middleware.isPatientLoggedIn , (req, res) => {
    var pid = req.params.pid;
    var did = req.params.did;
    res.render('doctors/consultForm', {pid: pid, did: did});
});

router.post('/patients/:pid/consult/:did',middleware.isPatientLoggedIn , (req, res) => {

    if(req.body.illnessHistory == null || req.body.recentSurgery == null || req.body.diabetic == null || req.body.allergies == null ||  //Validating Fields of multistep form
        req.body.others == null || req.body.transactionID == null){
            req.flash('error', 'Please enter all the fields');
            res.redirect('back');
    } else {
        Doctors.findById(req.params.did, (err, doc) => {
            if(err) throw err;
            Patients.findById(req.params.pid, (err, pat) => {
                if(err) throw err;
                var consult = {
                    illnessHistory: req.body.illnessHistory,
                    recentSurgery: req.body.recentSurgery,
                    diabetic: req.body.diabetic,
                    allergies: req.body.allergies,
                    others: req.body.others,
                    transactionID: req.body.transactionID,
                    patient: req.params.pid,
                    status: false,
                    doctor: req.params.did,
                    patientName: pat.name,
                    doctorName: doc.name
                }
                Consultations.create(consult, (err, consultation) => {
                    if(err){
                        console.log(err);
                    } else {
                        doc.consultations.push(consultation._id);
                        doc.save();
                        pat.consultations.push(consultation._id);
                        pat.save();
                        req.flash('success', 'Successfully Added Consultation Request');
                        res.redirect('/patients/index');
                    }
                });
            });
        })
    }
});

router.get('/patients/consultations',middleware.isPatientLoggedIn , (req, res) => {
    Patients.findById(req.user._id).populate('consultations').exec((err, patient) => {
        if(err){
            console.log(err);
        } else {   
            res.render('patients/consultations', {patient: patient});
        }
    });
});

router.get('/patients/completedconsultations/:cid/viewpdf',middleware.isPatientLoggedIn , (req, res) => {
    Consultations.findById(req.params.cid, (err, consult) => {
        if(err) {
            console.log(err);
        } else {
            var tempFile=`./public/pdfs/${consult.pdfName}`;
            fs.readFile(tempFile, function (err,data){
                res.contentType("application/pdf");
                res.send(data);                                              // Sending the correct PDF to browser
            });
        }
    });
});

// ========================================== Logout ========================================== //

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/')
});

module.exports = router;