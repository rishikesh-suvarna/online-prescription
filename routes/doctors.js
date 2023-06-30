const express = require("express"),
mongoose = require('mongoose'),
router  = express.Router(),
passport = require('passport'),
multer = require('multer'),
path = require('path'),
fs = require('fs'),
Doctors = require('../models/doctors'),
Patients = require('../models/patients'),
Consultations = require('../models/consultation'),
flash = require("connect-flash"),
puppeteer = require('puppeteer'),
middleware = require('../middleware'),
LocalStrategy = require('passport-local');


// ============================================== StorageEngine for Multer =============================================== //
const storage = multer.diskStorage({
    destination: './public/uploads/doctors',
    filename: (req, file, cb) => {
        cb(null, file.fieldname +'-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5000000
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

router.get('/doctors/index', middleware.isDoctorLoggedIn, (req, res) => {
    res.render('doctors/index');
}); 

// ============================================== Authentication routes =============================================== //

router.get('/doctors/signup', (req, res) => {
    res.render('doctors/signup');
});

router.post('/doctors/signup', (req, res) => {
    // var query = {$or:[{phoneNumber: req.body.phoneNumber}, {email: req.body.email}]};
    upload(req, res, (err) => {
        if(err){
            console.log(err);
        } else {
            var query = {$or:[{phoneNumber: req.body.phoneNumber}, {email: req.body.email}]};
            Doctors.findOne(query, (err, found) => {
                if(found){
                    var pathToPic = `public/uploads/doctors/${req.file.filename}`; // Deleting the pic uploaded if err occurs
                    try {
                        fs.unlinkSync(pathToPic);
                    } catch (error) {
                        console.log(error);
                    }
                    req.flash('error', 'Email ID or Phone Number is already registered');
                    return res.redirect('/doctors/signup');
                } else if (req.body.password != req.body.cpassword){
                    var pathToPic = `public/uploads/doctors/${req.file.filename}`;
                    try {
                        fs.unlinkSync(pathToPic);
                    } catch (error) {
                        console.log(error);
                    }
                    req.flash('error', 'Passwords don\'t match');
                    return res.redirect('/doctors/signup');
                } else {
                    var newUser = new Doctors ({
                        name: req.body.name,
                        email: req.body.email,
                        designation: 'doctor',
                        experience: req.body.experience,
                        profilePicture: req.file.filename,
                        speciality: req.body.speciality,
                        phoneNumber: req.body.phoneNumber,
                        password: req.body.password
                    });
                    Doctors.createUser(newUser, (err, user) => {
                        if(err) throw err;
                    });
                    req.flash('success', 'Successfully Signed Up !');
                    res.redirect('/doctors/signin');
                }
            }) 
        }

    });
});


router.get('/doctors/signin', (req, res) => {
    res.render('doctors/signin');
});


router.post('/doctors/signin', passport.authenticate('doctorLocal', 
{   successRedirect: '/doctors/index',
    failureRedirect: '/doctors/signin',
    failureFlash: true,
    successFlash: 'Welcome'
}), function(req, res){ 
});

//  ============================================== Profile routes ============================================= //

router.get('/doctors/profile/:id', middleware.isDoctorLoggedIn ,(req, res) => {
    Doctors.findById(req.params.id, (err, doctor) => {
        if(err) {
            console.log(err);
        } else {
            res.render('doctors/profile', {doctor: doctor});
        }
    });
});

router.get('/doctors/profile/:id/update', middleware.isDoctorLoggedIn , (req, res) => {
    Doctors.findById(req.params.id, (err, doctor) => {
        if(err) {
            console.log(err);
        } else {
            res.render('doctors/update', {doctor: doctor});
        }
    });
});


router.put('/doctors/profile/:id/update', middleware.isDoctorLoggedIn , (req, res) => {
    upload(req, res, (err) => {
        if(req.file){
            Doctors.findById(req.params.id, (err, foundDoctor) => {
                var pathToPic = `public/uploads/doctors/${foundDoctor.profilePicture}`;
                try {
                fs.unlinkSync(pathToPic);
                } catch (error) {
                console.log(error);
                }
            });
            var newDoc = {
                profilePicture: req.file.filename,
                name: req.body.name,
                email: req.body.email,
                speciality: req.body.speciality,
                phoneNumber: req.body.phoneNumber,
                experience: req.body.experience
            }
            Doctors.findByIdAndUpdate(req.params.id, newDoc, (err, newdoctor) => {
                if(err){
                    console.log(err);
                } else {
                    req.flash('success','Successfully Updated Profile')
                    res.redirect('/doctors/profile/'+req.params.id);
                }
            });
        } else {
            var newDoc = {
                name: req.body.name,
                email: req.body.email,
                speciality: req.body.speciality,
                phoneNumber: req.body.phoneNumber,
                experience: req.body.experience
            }
            Doctors.findByIdAndUpdate(req.params.id, newDoc, (err, newdoctor) => {
                if(err){
                    console.log(err);
                } else {
                    req.flash('success','Successfully Updated Profile')
                    res.redirect('/doctors/profile/'+req.params.id);
                }
            });
        }
    });
});


router.get('/doctors/profile/:id/changepassword', middleware.isDoctorLoggedIn, (req, res) => {
    Doctors.findById(req.params.id, (err, doc) => {
        if(err){
            console.log(err);
        } else {
            res.render('doctors/changepassword', {doctor: doc});
        }
    });
});

router.put('/doctors/profile/:id/changepassword', middleware.isDoctorLoggedIn, (req, res) => {

    if(req.body.password != req.body.cpassword){
        req.flash('error', 'Password & Confirm Password don\'t match');
        return res.redirect('back');
    } else {
        Doctors.findById(req.params.id, (err, doc) => {
            doc.password = req.body.password;
            Doctors.resetPassword(doc, (err, foundDoctor) => {
                if(err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Password Changed Successfully')
                    return res.redirect('/doctors/profile/'+req.params.id);
                }
            });
        });
    }

});

//  ============================================== Consultation routes ============================================= //

router.get('/doctors/consultations', middleware.isDoctorLoggedIn , (req, res) => {
    var myConsultations = [];
    Consultations.find({}, (err, consultations) => {
        if(err){
            console.log(err);
        } else {
            consultations.forEach((consultation) => {                                  //Check consultations for each doctor
                if(JSON.stringify(consultation.doctor) === JSON.stringify(req.user._id) && consultation.status === false){
                    myConsultations.push(consultation);
                }
            });
            res.render('doctors/consultations', {consultation: myConsultations});
        }
    })
});

router.get('/doctors/consultations/:cid/consult', middleware.isDoctorLoggedIn , (req, res) => {
    Consultations.findById(req.params.cid, (err, consultation) => {
        if(err){
            console.log(err);
        } else {
            Patients.findById(consultation.patient, (err, pat) => {
                if(err) throw err;
                // console.log(pat);
                res.render('doctors/consult', {patient: pat, consultation: consultation});
            })
        }
    });
});

router.post('/doctors/consultations/:cid/consult', middleware.isDoctorLoggedIn , (req, res) => {

    Doctors.findById(req.user._id, (err, doc) => {
        if(err){
            console.log(err);
        } else {
            // console.log(doc);
            var care = req.body.careToBeTaken.split('\r\n');
            var medi = req.body.medicines.split('\r\n');
            var date = new Date();
            date = date.toDateString();
            var dateNew = Date.now(); 
            Consultations.findById(req.params.cid, (err, foundConsultation) => {
                if(err){
                    console.log(err);
                } else {
                    care.forEach((c) => {
                        foundConsultation.careToBeTaken.push(c);
                    });
                    medi.forEach((m) => {
                        foundConsultation.medicines.push(m);
                    })
                    foundConsultation.status = true;
                    // foundConsultation.save();
        
                    var cares = foundConsultation.careToBeTaken.join(', ');
                    var medis = foundConsultation.medicines.join(', ');
                    const createPdf = async () => {                          //Using Puppeteer Library Function to create PDF of consultation form
                        const browser = await puppeteer.launch()
                        const page = await browser.newPage()
                        await page.setContent(                               //PDF Template
                            `
                            <h1 style="text-align: center;"> PRESCRIPTION </h1>
                            <div style="border: 2px dotted black; padding: 15px;">
                            <table style="width: 777px; border: 0; margin-left: auto; margin-right: auto;">
                            <tbody>
                            <tr>
                            <td style="width: 392px;">Dr. ${doc.name}</td>
                            <td style="width: 389px; padding-right: 20px; text-align: right;">Date: ${date}</td>
                            </tr>
                            </tbody>
                            </table>
                            <p>Address : lorem ipsum</p>
                            <p>&nbsp;</p>
                            <hr style="border-top: 15px solid navy" />
                            <p style="margin-left: 25px" >Care to be taken:</p>
                            <div style="width: 90%; border: 1px solid black; margin-left: auto; margin-right: auto; padding: 15px;">
                                <p> ${cares} </p>
                                <p>&nbsp;</p>
                            </div>
                            <hr style="border-top: 15px solid navy" />
                            <p style="margin-left: 25px">Medicines</p>
                            <div style="width: 90%; border: 1px solid black; margin-left: auto; margin-right: auto; padding: 15px;">
                                <p> ${medis} </p>
                                <p>&nbsp;</p>
                            </div>
                            <p>&nbsp;</p>
                            <hr />
                            <p style="text-align: right; margin-top: 80px;">Dr. ${doc.name}</p>
                            </div>
                            `
                        )
                        await page.emulateMedia('screen'),
                        await page.pdf({
                            path: `./public/pdfs/prescription-${dateNew}.pdf`,
                            height: '800px',
                            printBackground: true
                        });
                
                        await browser.close();
                    }
                    createPdf();
                    foundConsultation.pdfName = `prescription-${dateNew}.pdf`
                    foundConsultation.save();
                    req.flash('success', 'Successfully Consulted & PDF Generated');
                    res.redirect("/doctors/consultations");
                }
            });
        }
    })
});


router.get('/doctors/completedconsultations', middleware.isDoctorLoggedIn , (req, res) => {
    var myConsultations = [];
    Consultations.find({}, (err, consultations) => {
        if(err){
            console.log(err);
        } else {
            consultations.forEach((consultation) => {                       //Checking for completed consultations
                if(JSON.stringify(consultation.doctor) === JSON.stringify(req.user._id) && consultation.status === true){
                    myConsultations.push(consultation);
                }
            });
            res.render('doctors/completedconsultations', {consultation: myConsultations});
        }
    });
});


router.get('/doctors/completedconsultations/:cid/viewpdf', middleware.isDoctorLoggedIn , (req, res) => {
    Consultations.findById(req.params.cid, (err, consult) => {
        if(err) {
            console.log(err);
        } else {
            var tempFile=`./public/pdfs/${consult.pdfName}`;
            fs.readFile(tempFile, function (err,data){
                res.contentType("application/pdf");
                res.send(data);                                             // Sending the correct PDF to browser
            });
        }
    });
});


router.get('/doctors/completedconsultations/:cid/update', middleware.isDoctorLoggedIn , (req,res) => {
    Consultations.findById(req.params.cid, (err, foundConsultation) => {
        if(err){
            console.log(err);
        } else {
            Patients.findById(foundConsultation.patient, (err, pat) => {
                if(err){
                    console.log(err);
                } else {
                    var care  = foundConsultation.careToBeTaken.join('\n')
                    var medi  = foundConsultation.medicines.join('\n')
                    res.render('doctors/updateconsultations', {consultation: foundConsultation, patient: pat, care: care, medi: medi});
                }
            })
        }
    });
});

router.put('/doctors/completedconsultations/:cid/update', middleware.isDoctorLoggedIn , (req, res) => {
    Doctors.findById(req.user._id, (err, doc) => {
        if(err){
            console.log(err);
        } else {
            Consultations.findById(req.params.cid, (err, foundConsultation) => {
                if(err){
                    console.log(err);
                } else {
                    var pathToPdf = `public/pdfs/${foundConsultation.pdfName}`;
                    try {
                    fs.unlinkSync(pathToPdf);
                    } catch (error) {
                    console.log(error);
                    }
                    var care = req.body.careToBeTaken.split('\r\n');
                    var medi = req.body.medicines.split('\r\n');
                    foundConsultation.careToBeTaken = [];
                    foundConsultation.medicines = [];
                    care.forEach((c) => {
                        foundConsultation.careToBeTaken.push(c);
                    });
                    medi.forEach((m) => {
                        foundConsultation.medicines.push(m);
                    });
                    var cares = foundConsultation.careToBeTaken.join(', ');
                    var medis = foundConsultation.medicines.join(', ');
                    var date = new Date();
                    date = date.toDateString();
                    var dateNew = Date.now(); 
                    const createPdf = async () => {
                        const browser = await puppeteer.launch()
                        const page = await browser.newPage()
                        await page.setContent(
                            `
                            <h1 style="text-align: center;"> PRESCRIPTION </h1>
                            <div style="border: 2px dotted black; padding: 15px;">
                            <table style="width: 777px; border: 0; margin-left: auto; margin-right: auto;">
                            <tbody>
                            <tr>
                            <td style="width: 392px;">Dr. ${doc.name}</td>
                            <td style="width: 389px; padding-right: 20px; text-align: right;">Date: ${date}</td>
                            </tr>
                            </tbody>
                            </table>
                            <p>Address : lorem ipsum</p>
                            <p>&nbsp;</p>
                            <hr style="border-top: 15px solid navy" />
                            <p style="margin-left: 25px" >Care to be taken:</p>
                            <div style="width: 90%; border: 1px solid black; margin-left: auto; margin-right: auto; padding: 15px;">
                                <p> ${cares} </p>
                                <p>&nbsp;</p>
                            </div>
                            <hr style="border-top: 15px solid navy" />
                            <p style="margin-left: 25px">Medicines</p>
                            <div style="width: 90%; border: 1px solid black; margin-left: auto; margin-right: auto; padding: 15px;">
                                <p> ${medis} </p>
                                <p>&nbsp;</p>
                            </div>
                            <p>&nbsp;</p>
                            <hr />
                            <p style="text-align: right; margin-top: 80px;">Dr. ${doc.name}</p>
                            </div>
                            `
                        )
                        await page.emulateMedia('screen'),
                        await page.pdf({
                            path: `./public/pdfs/prescription-${dateNew}.pdf`,
                            height: '800px',
                            printBackground: true
                        });
                
                        await browser.close();
                    }
                    createPdf();
                    foundConsultation.pdfName = `prescription-${dateNew}.pdf`
                    foundConsultation.save();
                    req.flash('success', 'Successfully Updated Consultation & New PDF Generated');
                    res.redirect('/doctors/completedconsultations');
                }
            });
        }
    });
});

// ================================ Logout ====================================== //

router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Logout Successful')
    res.redirect('/')
});




module.exports = router;