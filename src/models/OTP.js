const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');

const OTPSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now(),
    required: true,
    expires: '50m',
  },
});

async function sendVerificationCode(email, otp) {
  try {
    const mailResponse = await mailSender(email, 'Verification code send', otp);
    console.log('Mail sent successfully', mailResponse);
  } catch (error) {
    console.error({
      hasError: true,
      error: error.message,
    });
    throw new Error('Failed to send verification code');
  }
}

OTPSchema.pre('save', async function (next) {
  await sendVerificationCode(this.email, this.otp);
  next();
});

module.exports = mongoose.model('OTP', OTPSchema);
