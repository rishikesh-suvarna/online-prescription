const mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var doctorSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    profilePicture: String,
    designation: String,
    speciality: String,
    phoneNumber: {
        type: String,
        unique: true
    },
    experience: Number,
    password: String,
    consultations: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'consultation'
    }]
});

var Doctor = module.exports = mongoose.model('doctor', doctorSchema);

var salt = bcrypt.genSaltSync(10);

module.exports.createUser = (newUser, callback) =>{
    bcrypt.hash(newUser.password, salt, (err, hash) => {
        // Store hash in your password DB.
        newUser.password = hash;
        newUser.save(callback);
    });
}

module.exports.getUserByEmail = function(email, callback){
    var query = {email: email};
    Doctor.findOne(query, callback);
}

module.exports.getUserById = function(id, callback){
    Doctor.findById(id, callback);
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