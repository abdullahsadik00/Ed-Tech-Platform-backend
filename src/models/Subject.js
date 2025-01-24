const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true,
  },
  icon: { type: String, required: true },
  color: { type: String, required: true },

  course: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
  ],
});
module.exports = mongoose.model('Subject', SubjectSchema);
