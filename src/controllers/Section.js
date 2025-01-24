const Course = require('../models/Course');
const Section = require('../models/Section');

exports.createSection = async function (req, res) {
  try {
    const { title, order, courseId } = req.body;
    if (!title || !order || !courseId) {
      return res.status(404).json({
        message: 'Title, order and courseId are required',
        hasError: true,
      });
    }
    const section = await Section.create({
      title: title,
      order: order,
    });

    await Course.findByIdAndUpdate(
      courseId,
      {
        $push: { sections: section._id },
      },
      { new: true }
    ).populate('section');

    return res.status(201).json({
      message: 'Section created successfully',
      data: section,
      hasError: false,
    });
  } catch (error) {
    return res.status(404).json({
      message: 'Failed to create section',
      hasError: true,
      error: error.message,
    });
  }
};

exports.updateSection = async (req, res) => {
  try {
    const { title, order, courseId, sectionId } = req.body;
    if (!title || !order || !courseId) {
      return res.status(404).json({
        message: 'Title, order and courseId are required',
        hasError: true,
      });
    }
    const section = await Section.findByIdAndUpdate(
      sectionId,
      {
        title: title,
        order: order,
        courseId: courseId,
      },
      { new: true }
    ).populate('subsections');
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update section',
      hasError: true,
      error: error.message,
    });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const { sectionId } = req.body;
    if (!sectionId) {
      return res.status(404).json({
        message: 'SectionId is required',
        hasError: true,
      });
    }
    const section = await Section.findByIdAndDelete(sectionId);
    Course.findByIdAndUpdate(
      sectionId,
      {
        $pull: { sections: sectionId },
      },
      { new: true }
    );
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to delete section',
      hasError: true,
      error: error.message,
    });
  }
};
