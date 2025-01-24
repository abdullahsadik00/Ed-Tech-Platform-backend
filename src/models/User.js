const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true, 
    lowercase: true,
  },
  password: { type: String, required: true }, 
  role: {
    type: String,
    // required: true,
    enum: ['admin', 'student', 'instructor'],
  },
  additionalDetails: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Profile',
  },
  courses: [{ type: mongoose.Types.ObjectId, ref: 'Course' }], 
  image: { type: String, required: true },
  courseProgress: [
    {
      type: mongoose.Types.ObjectId,
      ref: 'CourseProgress',
    },
  ],
  token: { type: String, 
    // required: true
  },
  resetPasswordExpires: { type: String, 
    // required: true
  }
}, { timestamps: true }); 

const User = mongoose.model('User', UserSchema);
module.exports = User;
