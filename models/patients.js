const mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var patientSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    designation: String,
    age: Number,
    profilePicture: String,
    phoneNumber: {
        type: String,
        unique: true
    },
    historySurgery: [{
        type: String
    }],
    historyIllness: [{
        type: String
    }],
    password: String,
    consultations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'consultation'
    }]
});

var Patient = module.exports = mongoose.model('patient', patientSchema);

var salt = bcrypt.genSaltSync(10);

module.exports.createUser = (newUser, callback) =>{
    bcrypt.hash(newUser.password, salt, (err, hash) => {
        // Store hash in your password DB.
        newUser.password = hash;
        newUser.save(callback);
    });
}

var salt = bcrypt.genSaltSync(10);

module.exports.createUser = (newUser, callback) =>{
    bcrypt.hash(newUser.password, salt, (err, hash) => {
        // Store hash in your password DB.
        newUser.password = hash;
        newUser.save(callback);
    });
}

module.exports.getUserByEmail = function(username, callback){
    var query = {$or:[{username: username}, {email: username}]};
    Patient.findOne({email: username}, callback);
}

module.exports.getUserById = function(id, callback){
    Patient.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
    bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
        // res === true
        if(err) throw err;
        callback(null, isMatch);
    });
}

module.exports.resetPassword = function(newUser, callback){
    bcrypt.hash(newUser.password, salt, function(err, hash) {
        // Store hash in your password DB.
        newUser.password = hash;
        newUser.save(callback);
    });
}