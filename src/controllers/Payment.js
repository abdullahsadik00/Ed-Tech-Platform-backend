const { instance } = require('../config/instance');
const Course = require('../models/Course');
const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const courseEnrollmentTemplate = require('../mail/templates/courseEnrollmentTemplate');
const { default: mongoose } = require('mongoose');
const { emailVerificationTemplate } = require('../mail/templates/emailVerificationTemplate');

exports.capturePayment = async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user.id;
  if (!userId) {
    return res.status(401).json({
      message: 'User not authenticated',
      hasError: true,
    });
  }
  if (!courseId) {
    return res.status(400).json({
      message: 'Course ID is required',
      hasError: true,
    });
  }
  try {
    let course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: 'Course not found',
        hasError: true,
      });
    }
    const uId = new mongoose.Types.ObjectId(userId);
    if (course.studentEnrollment.includes(uId)) {
      return res.status(400).json({
        message: 'User already enrolled in this course',
        hasError: true,
      });
    }
    const amount = course.price;
    const currency = course.currency;
    const options = {
      amount: amount * 100,
      currency,
      receipt: Math.random(Date.now()),
      notes: {
        userId: uId,
        courseId: courseId,
      },
    };
    const paymentResponse = await instance.order.create(options);
    console.log(paymentResponse);
    res.status(200).json({
      message: 'Payment initiated successfully',
      data: {
        paymentResponse,
        courseName: course.courseName,
        coursePrice: course.price,
        courseId: course.id,
        courseDescription: course.courseDescription,
        thumbnail: course.thumbnail,
        orderId: paymentResponse.id,
        currency: course.currency,
      },
      hasError: false,
    });
  } catch (error) {
    return {
      message: error.message,
      hasError: true,
    };
  }
};

exports.verifySignature = async (req, res) => {
  try {
    const webhookSecret = '12342';
    const signature = req.headers['x-razorpay-signature'];
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');
    if (digest === signature) {
      const { userId, courseId } = req.body.payload.payment.entity.notes;
      const course = await Course.findByIdAndUpdate(
        { _id: courseId },
        {
          $push: {
            studentEnrollment: userId,
          },
        }
      );
      if (!course) {
        return res.status(404).json({
          hasError: true,
          message: 'Course not found',
        });
      }
      const user = await User.findByIdAndUpdate(
        { _id: userId },
        {
          $push: {
            courses: courseId,
          },
        }
      );
      if (!user) {
        return res.status(404).json({
          hasError: true,
          message: 'User not found',
        });
      }
      const emailResponse = mailSender(user.email,"Congratulation from Ed-Tech","Congratulation you have successfully enrolled in the course")
      return res.status(200).json({
        hasError: false,
        message: `Course enrolled successfully`,
      })
    }else{
      return res.status(400).json({
        hasError: true,
        message: `Invalid signature`,
      });
    }
  } catch (error) {
    return res.status(400).json({
      hasError: true,
      message: `Invalid signature ${error}`,
    });
  }
};
