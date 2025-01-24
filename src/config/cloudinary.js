const cloudinary = require('cloudinary').v2

exports.cloudinaryConnect = () =>{
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        })
        console.log('Connected to Cloudinary')
    } catch (error) {
        console.error('Cloudinary', error);
    }
}