const mongoose = require('mongoose');

const SectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    // content: { type: String },
    order: { type: Number },
    // videos: [
    //   {
    //     title: { type: String },
    //     url: { type: String },
    //     duration: { type: Number },
    //   },
    // ],
    quizzes: [
      {
        title: { type: String },
        questions: [
          {
            type: String,

            answer: { type: String },
            options: [{ type: String }],
          },
        ],
      },
    ],
    subSection :[
      {type:mongoose.Types.ObjectId,
        ref: 'SubSection'
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Section', SectionSchema);
