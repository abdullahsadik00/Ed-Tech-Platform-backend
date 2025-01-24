const Section = require('../models/Section');
const SubSection = require('../models/SubSection');
const { uploadImagetoCloudinary } = require('../utils/imageUploader');

// Crete SubSection
exports.createSubSection = async (req, res) => {
  try {
    // fetch the data from the request body
    const { sectionId, title, description, timeDuration } = req.body;
    // extract the file/video
    const video = req.files.videoFile;
    // validate the fields
    if (!sectionId || !title || !description || !timeDuration || !video) {
      return res.status(400).json({
        message: 'All fields are required',
        hasError: true,
      });
    }
    // upload the video to cloudinary server
    const uploadDetails = await uploadImagetoCloudinary(
      video,
      process.env.FOLDER_NAME
    );
    // create the sub section
    const newSubSection = await SubSection.create({
      title,
      description,
      timeDuration,
      videoUrl: uploadDetails.secure_url,
    });
    // update the section with the new sub section id
    await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: { subsections: newSubSection._id },
      },
      { new: true }
    ).populate('subsections');
    return res.status(201).json({
      message: 'Subsection created successfully',
      data: newSubSection,
      hasError: false,
    });
    // return the response
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to create subsection',
      hasError: true,
      error: error.message,
    });
  }
};

exports.updateSubsection = async (req, res) => {
  try {
    const { sectionId,subSectionId, title, description, timeDuration } = req.body;
    const video = req.files.videoFile;
    if (!sectionId || !title || !description || !timeDuration || !video) {
      return res.status(404).json({
        message: 'All fields are required',
        hasError: true,
      });
      
    }const uploadDetails = await uploadImagetoCloudinary(
        video,
        process.env.FOLDER_NAME
      );

      const subSection = await SubSection.findByIdAndUpdate({_id:subSectionId},{
        title,
        description,
        timeDuration,
        videoUrl: uploadDetails.secure_url,
      })
      console.log("subSection",subSection)
      return res.status(200).json({
        message: 'Subsection updated successfully',
        data: subSection,
        hasError: false,
      })
  } catch (error) {
    return res.status(500).json({});
  }
};

exports.deleteSubsection = async (req, res) => {
    try {
      const { sectionId, subSectionId } = req.body;
      if (!sectionId ||!subSectionId) {
        return res.status(400).json({
          message: 'All fields are required',
          hasError: true,
        });
      }
      await SubSection.findByIdAndDelete(subSectionId);
      await Section.findByIdAndUpdate(
        { _id: sectionId },
        { $pull: { subsections: subSectionId } },
        { new: true }
      ).populate('subsections');

      return res.status(200).json({
        message: 'Subsection deleted successfully',
        hasError: false,
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Failed to delete subsection',
        hasError: true,
        error: error.message,
      });
    }
  };
