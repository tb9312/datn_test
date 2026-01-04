const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

//Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET, // Click 'View API Keys' above to copy your API secret
});
// End cloudinary

//Upload len cloudinary
let streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    let stream = cloudinary.uploader.upload_stream((error, result) => {
      if (result) {
        resolve(result);
      } else {
        reject(error);
      }
    });

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// Lay ra url
module.exports.uploadToCloudinary = async function upload(buffer) {
  let result = await streamUpload(buffer);
  // console.log(result.secure_url);
  return result.secure_url;
};
