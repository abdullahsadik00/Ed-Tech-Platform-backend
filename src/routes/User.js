// const express = require('express');
// const { login, signUp, sendOTP } = require('../controllers/auth.controller');
// const { auth } = require('../middlewares/Auth');
// const {
//   updatePassword,
//   forgotPasswordToken,
//   forgotPassword,
// } = require('../controllers/ResetPassword');
// const router = express.Router(); // Initialize the router

// // User login request
// // This endpoint allows users to log in by providing their credentials.
// router.post('/login', login);

// // User signup request
// // This endpoint allows new users to create an account by providing their details.
// router.post('/signup', signUp);

// // Send OTP request
// // This endpoint sends a One-Time Password (OTP) to the user's registered email or phone number for verification.
// router.post('/sendOtp', sendOTP);

// // Change password
// // This endpoint allows authenticated users to change their password.
// // It requires a valid token from the authentication middleware.
// router.post('/updatepassword', auth, updatePassword);

// // Reset Password
// // This endpoint allows users to reset their password by providing their email.
// router.post('/forgot-password', forgotPassword);

// // Reset Password Token
// // This endpoint verifies the token sent to the user and allows them to set a new password.
// router.post('/reset-password-token', forgotPasswordToken);

// module.exports = router;
