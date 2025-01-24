const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9]+$/, // Alphanumeric characters only
    unique: true,
  },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  description: {
    type: String,
    trim: true,
    maxlength: 255,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[a-zA-Z0-9\s]+$/, // Alphanumeric characters and spaces only
    index: true, // Create a text index on this field for full-text search optimization.
    default: '', // Set default value to empty string if not provided.
  },
});

module.exports = mongoose.model('Tag', TagSchema);
