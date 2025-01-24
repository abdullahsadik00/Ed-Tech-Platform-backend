const Profile = require('../models/Profile');
const User = require('../models/User');

exports.updateProfile = async (req, res) => {
  try {
    const { dateOfBirth = '', gender, about = '', contactNumber } = req.body;
    const id = req.user.id;
    if (!contactNumber || !gender) {
      return res.status(400).json({
        message: 'Contact number and gender are required',
        hasError: true,
      });
    }
    const userDetails = await User.findById(id);
    const profileId = userDetails.additionalDetails;
    const profileDetails = await Profile.findById(profileId);
    profileDetails.gender = gender;
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.contact = contactNumber;
    await profileDetails.save();
    return res.status(200).json({
      message: 'Profile updated successfully',
      data: profileDetails,
      hasError: false,
    });
  } catch (error) {
    return res.status(404).json({
      message: 'Profile not found',
      hasError: true,
    });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(404).json({
        message: 'User not found',
        hasError: true,
      });
    }
    const userDetails = await User.findById(userId);
    const profileId = userDetails.additionalDetails;
    await Profile.findByIdAndDelete(profileId);
    await User.findByIdAndDelete({ _id: userId });
    return res.status(200).json({
      message: 'Profile deleted successfully',
      data: null,
      hasError: false,
    });
  } catch (error) {
    return res.status(404).json({
      message: 'Profile not found',
      hasError: true,
    });
  }
};

exports.getAllUser = async (req, res) => {
  try {
    const allUser = await User.find({}).populate('additionalDetails').exec();
    return res.status(200).json({
      hasErrors: false,
      data: allUser,
      message: 'All users retrieved successfully',
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to get user',
      hasError: true,
    });
  }
};
