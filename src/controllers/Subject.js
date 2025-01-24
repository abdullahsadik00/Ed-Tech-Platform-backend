const Course = require('../models/Course');
const Subject = require('../models/Subject');

exports.createSubject = async (req, res) => {
  try {
    const { subjectName, courseId, colorCode, icon } = req.body;

    // Validate that all required fields are provided
    if (!subjectName || !courseId || !colorCode || !icon) {
      return res.status(400).json({
        message: 'Subject name, courseId, colorCode and icon are required',
        hasError: true,
      });
    }

    // Check if the course exists in the database
    const courseDetails = await Course.findById(courseId);
    if (!courseDetails) {
      return res.status(404).json({
        message: 'Course not found',
        hasError: true,
      });
    }

    // Create a new Subject instance
    const newSubject = new Subject({
      subjectName: subjectName,
      icon: icon,
      color: colorCode,
      course: courseId, // reference to the course
    });

    // Save the new subject to the database
    await newSubject.save();

    // Return the success response
    return res.status(200).json({
      message: 'Subject created successfully',
      hasError: false,
      data: newSubject,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Failed to create subject',
      hasError: true,
      error: error.message,
    });
  }
};
