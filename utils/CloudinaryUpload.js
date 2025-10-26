const cloudinary = require('../config/configCloudinary');
const streamifier = require('streamifier')
const cloudinaryUpload = (fileBuffer) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
  
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  };
  
  module.exports =  cloudinaryUpload ;