const Tags = require('../models/Tags');

exports.addTag = async (req, res) => {
  try {
    // validate request body
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({
        hasError: true,
        message: 'Name and description are required',
      });
    }
    const tag = await Tags.create({
      name,
      description,
    });
    res.status(201).json({
      hasError: false,
      data: tag,
      message: 'Tag added successfully',
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

exports.getAllTags = async (req, res) => {
  try {
    const tags = await Tags.find({}, { name: true, description: true });
    res.json({
      hasError: false,
      data: tags,
      message: 'All tags retrieved successfully',
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

exports.getCategoryPageDetails = async (req, res) => {
  try {
    const tagId = req.body.tagId;
    const selectedTags = await Tags.findById({ _id: tagId })
      .populate('courses')
      .exec();
      if (!selectedTags) {
        return res.status(404).json({
          hasError: true,
          message: 'Tag not found',
        });
      }
      const differentTags = await Tags.find({
        _id: { $ne: tagId },
      }).populate('courses').exec();
      // TODO:Top Selling Course
      return res.status(200).json({
        hasError: false,
        data: {
          selectedTags,
          differentTags,
        },
        message: 'Category page details retrieved successfully',
      });
  } catch (error) {
    return res.status(400).json({
      hasError: true,
      message: 'Failed to get category page details',
    });
  }
};
