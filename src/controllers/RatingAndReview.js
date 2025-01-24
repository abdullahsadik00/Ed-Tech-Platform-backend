const RatingAndReview = require('../models/RatingAndReview');
const User = require('../models/User');
const Course = require('../models/Course');

exports.createRatingAndReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { courseId, rating, review } = req.body;
    if (!userId || !courseId || !rating || !review) {
      return res.status(400).json({
        hasError: true,
        message: 'Missing required fields',
      });
    }
    const isUserEnrolled = await Course.findOne({
      _id: course,
      studentEnrollment: { $eleMatch: { $eq: userId } },
    });
    if (!isUserEnrolled) {
        return res.status(404).json({
          hasError: true,
          message: 'User is not enrolled in the course',
        });
    }
    const isAlreadyReviewed = RatingAndReview.findById({user: userId,course: courseId})
    if (isAlreadyReviewed) {
        return res.status(400).json({
          hasError: true,
          message: 'User has already reviewed this course',
        });
    }
    const ratingAndReview = await RatingAndReview.create({
        user: userId,
        course: courseId,
        rating: rating,
        review: review,
    });
    await Course.findByIdAndUpdate({_id: courseId},{
        $push:{
            ratingsAndReviews: ratingAndReview._id
        }
    },{new:true})
    return res.status(201).json({
        hasError: false,
        data: ratingAndReview,
        message: 'Rating and review created successfully',
    });
  } catch (error) {
    return res.status(404).json({
      hasError: true,
      message: 'An error occurred while creating rating and review',
    });
  }
};

exports.getAverageRating = async (req, res) => {
    try {
        const {courseId} = req.body;
        const averageRating = await RatingAndReview.aggregate({
            $match :{
                course: new Mongoose.Types.ObjectId(courseId)
            },
            $group :{
                _id: null,
                averageRating: { $avg: "$rating" }
            },

        })
        if(averageRating.length > 0) {
            res.status(200).json({
                hasError: false,
                data: averageRating[0],
                message: 'Average rating retrieved successfully',
            })
        }else{
            res.status(404).json({
                hasError: false,
                data:0,
                message: 'Average rating retrieved successfully',
            })
        }
    } catch (error) {
        return res.status(404).json({
            hasError: true,
            message: 'An error occurred while retrieving average rating',
        })
    }
}

exports.getAllRatingAndReview = async(req,res) =>{
    try {
        const allReviewsRating = await RatingAndReview.findAll({}).sort({rating:'desc'}).populate(
            {path:'user',
                select : "firstname lastname email image"
            }).populate({
                path:'course',
                select : "courseName"
            }).exec()
            if(!allReviewsRating){
                return res.status(404).json({
                    hasError: true,
                    message: 'No rating and reviews found',
                })
            }
            return res.status(200).json({
                hasError: false,
                data: allReviewsRating,
                message: 'All rating and reviews retrieved successfully',
            })
    } catch (error) {
        return res.status(404).json({
            hasError: true,
            message: 'An error occurred while retrieving all rating and reviews',
        })
    }
}