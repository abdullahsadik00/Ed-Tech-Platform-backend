const Razorpay = require("razorpay")

exports.instance = new Razorpay({
    key_id: process.env.RAZORYPAY_KEY,
    key_secret: process.env.RAZORYPAY_SECRET,
   })