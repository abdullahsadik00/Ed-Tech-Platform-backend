const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
var crypto = require('crypto');


// resetpasswordtoken
exports.forgotPasswordToken = async (req, res) => {
  try {
    // get email from body and
    const { email } = req.body;
    // check and validate
    console.log('email', email);
    const user = await User.findOne({ email: email });
    console.log('user', user);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        hasError: true,
      });
    }

    // token
    const token = crypto.randomUUID();
    console.log('token', token);
    // update the user with token and expiration timestamp
    // create url
    const url = `https://localhost:3000/update-password/${token}`;
    console.log('url', url);
    // send email with url to user
    // save token in redis with expiration time
    const updatedUser = await User.findOneAndUpdate(
      {
        email: email,
      },
      {
        token: token,
        resetPasswordExpires: "50m",
      },
      { new: true }
    );
    // send email with link to reset password
    // await mailSender(
    //   email,
    //   'Password reset link',
    //   `Click the link to reset your password: ${url}`
    // );
    console.log(updatedUser);
    res.status(200).json({
      message: 'Reset password token sent successfully',
      hasError: false,
      data:url,
      updatedUser
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to send reset password token',
      hasError: true,
      error: error.message
    });
  }
};

// Reset password

exports.forgotPassword = async (req, res) => {
  console.warn('reset password')
  try {
    const { password, confirmPassword, token } = req.body;
    const isUserExist = await User.findOne({ token: token });
    console.log("resetPassword",User)
    if (!isUserExist) {
      return res.status(404).json({
        message: 'Token not found',
        hasError: true,
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match',
        hasError: true,
      });
    }
    console.log("password !== confirmPassword",password !== confirmPassword)
    if (isUserExist.resetPasswordExpires >= Date.now()) {
      return res.status(401).json({
        hasError: true,
        message: 'Token expired',
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate(
      { token: token },
      { password: hashedPassword },
      { new: true }
    );
    return res.status(200).json({
      message: 'Password reset successfully',
      hasError: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to reset password',
      hasError: true,
      error: error.message,
    });
  }
};

// update password
exports.updatePassword = async function (req, res) {
  try {
    const { password, confirmPassword } = req.body;
    const token =
      req.body.token || req.cookies.token || req.headers('Authorization');
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: 'Passwords do not match', hasError: true });
    }
    const decoded = await jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findByIdAndUpdate(
      decoded.id,
      { password: password },
      { new: true }
    );
    if (!user) {
      return res
        .status(404)
        .json({ message: 'User not found', hasError: true });
    }
    return res
      .status(200)
      .json({ message: 'Password updated successfully', hasError: false });
  } catch (error) {
    return res.status(404).json({
      message: 'Password update failed',
      hasError: true,
      error: error,
    });
  }
};
