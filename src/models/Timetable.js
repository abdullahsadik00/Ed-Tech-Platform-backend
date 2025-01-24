const mongoose = require('mongoose');

const TimeTableSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  },
  time: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: /^[0-9]{1,2}:[0-5][0-9]$/, // HH:MM format
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
  colorCode: {
    type: String,
    required: true,
    trim: true,
  },
});
module.exports = mongoose.model('Timetable', TimeTableSchema);
