const uploadToCloudinary = require("../../helpers/uploadToCloudinary");
module.exports.upload = async (req, res, next) => {
  // console.log(req);
  if (req.file) {
    const link = await uploadToCloudinary.uploadToCloudinary(req.file.buffer);
    req.body[req.file.fieldname] = link;
  }
  next();
};
