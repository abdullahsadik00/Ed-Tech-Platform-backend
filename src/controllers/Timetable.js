const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const User = require('../models/User');

exports.createTimetable = async (req, res) => {
  try {
    const { subjectId, time, teacherId, icon, colorCode } = req.body;
    if (!subjectId || !time || !teacherId || !icon || !colorCode) {
      return res.status(400).json({
        hasError: true,
        message: 'Subject, time, teacher, icon, and colorCode are required',
      });
    }
    const subjectDetails = await Subject.findById(subjectId);
    if (!subjectDetails) {
      return res.status(404).json({
        message: 'Subject not found',
        hasError: true,
      });
    }
    const teacherDetails = await User.findById(teacherId);
    if (!teacherDetails) {
      return res.status(404).json({
        message: 'Teacher not found',
        hasError: true,
      });
    }
    const newTimeTable = new Timetable({
      subject: subjectDetails._id,
      time,
      teacher: teacherDetails._id,
      icon,
      colorCode,
    });
    await newTimeTable.save();
    res.status(200).json({
      message: 'Timetable created successfully',
      data: savedTimetable,
      hasError: false,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Failed to create timetable',
      hasError: true,
      error: error.message,
    });
  }
};
