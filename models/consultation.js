const mongoose = require('mongoose');

var consultationSchema = new mongoose.Schema ({
    patient: mongoose.Schema.Types.ObjectId,
    doctor: mongoose.Schema.Types.ObjectId,
    patientName: String,
    doctorName: String,
    illnessHistory: String,
    recentSurgery: String,
    diabetic: String,
    allergies: String,
    others: String,
    status: Boolean,
    transactionID: String,
    pdfName: String,
    careToBeTaken: [{
        type: String
    }],
    medicines: [{
        type: String
    }]
});

module.exports = mongoose.model('consultation', consultationSchema);
