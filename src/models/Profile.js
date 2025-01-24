const mongoose = require('mongoose');

const ProfileSchmea = new mongoose.Schema({
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    // required: true,
  },
  dateOfBirth: {
    type: String,
  },
  about: {
    type: String,
    trim: true,
  },
  contact: {
    type: String,
    trim: true,
  },
});

module.exports = mongoose.model('Profile', ProfileSchmea);