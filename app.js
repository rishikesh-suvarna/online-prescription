const express = require('express'),
app = express(),
bodyParser = require('body-parser'),
methodOverride = require('method-override'),
mongoose = require('mongoose'),
passport = require('passport'),
multer = require('multer'),
flash = require("connect-flash"),
LocalStrategy = require('passport-local'),
Doctor = require('./models/doctors'),
Patient = require('./models/patients'),
PORT = 3000 || process.env.PORT; 


// ==================================== Mongoose Deprecation Warnings =============================== //
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true); 

// ================================ Setting Up Express-session ======================== //
app.use(require("express-session")({
    cookie: { path: '/', httpOnly: true, maxAge: 36000000},
    secret: process.env.SECRET,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false
}));
  
// =============================== Express-Config-Middlleware ========================== //
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// =============================== Database Connection ================================ //

mongoose.connect('mongodb://localhost/online_prescription').then(console.log('Database Connected'));


// =============================== Requiring Routes ====================================//

var doctorRoutes = require('./routes/doctors'),
    patientRoutes = require('./routes/patients');



// <========================================================== Passport-Config ====================================================>
passport.use('doctorLocal', new LocalStrategy(                     //Doctor's LocalStrategy for authentication
    function(username, password, done){                            //NOTE: For some reason passport loacl strategy doesn't consider "email" as a field name so we have to pass "email" as "username" // 
      Doctor.getUserByEmail(username, function(err, doctor){
          if(err) throw err;
          if(!doctor){
              return done (null, false, {message: "Email is not registered"});
          }  
          Doctor.comparePassword(password, doctor.password, function(err, isMatch){
            if(err) throw err;
            if(isMatch){
                return done(null, doctor);
            } else {
                return done(null, false, {message: "Incorrect Password"});
            }
          });
      })
}));

passport.use('patientLocal',new LocalStrategy(                          //Patients's LocalStrategy for authentication
    function(email, password, done){
      Patient.getUserByEmail(email, function(err, patient){
          if(err) throw err;
          if(!patient){
              return done (null, false, {message: "Email is not registered"});
          }
          Patient.comparePassword(password, patient.password, function(err, isMatch){
            if(err) throw err;
            if(isMatch){
                return done(null, patient);
            } else {
                return done(null, false, {message: "Incorrect Password"});
            }
          });
      })
}));


passport.serializeUser(function(user, done) {                             //Serializing & DeSerializing for browser session
    var key = {
      id: user.id,
      type: user.designation
    }
    done(null, key);
});

passport.deserializeUser(function(key, done) {
    var Model = key.type === 'doctor' ? Doctor : Patient; 
    Model.findOne({
      _id: key.id
    }, '-salt -password', function(err, user) {
      done(err, user);
    });
});

// ==================================== Middleware =================================== //

app.use(function(req, res, next){
    res.locals.currentUser = req.user || null;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// =============================== ROUTES ============================================= //

app.get('/', (req, res) => {
    res.render('index');
}); 

app.use(doctorRoutes);
app.use(patientRoutes);

// ============================ Wrong Routes Handled ================================= //
app.get('*', (req, res) => {
    res.status(404).send({Error: '404 Not Found'});
});

// ======================================== SERVER ========================================= //

app.listen(PORT, () => {
    console.log(`=======================> Server started on port ${PORT} <============================`);
});