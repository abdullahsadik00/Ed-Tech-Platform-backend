const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true,
    trim: true,
  },
  courseDescription: {
    type: String,
    required: true,
    trim: true,
  },
  instructor: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  whatYouwillLearn: {
    type: String,
    required: true,
  },
  section: {
    type: mongoose.Types.ObjectId,
    ref: 'Section',
    required: true,
  },
  ratingAndReview: {
    type: mongoose.Types.ObjectId,
    ref: 'RatingAndReview',
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  studentEnrollment: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  currency:{
    type: String,
    default: 'INR'
  }
});

module.exports = mongoose.model('Course', CourseSchema);
