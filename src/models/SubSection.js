const mongoose = require('mongoose');

const SubSectionsSchema = new mongoose.Schema({
  title: {
    type: 'string',
  },
  timeDuration: {
    type: 'string',
  },
  description: {
    type: 'string',
  },
  videoUrl: {
    type: 'string',
  },
});

module.exports = mongoose.models('subsections', SubSectionsSchema);
