const User = require("../../../models/user.model");
module.exports.infoUser = async (req, res, next) => {
  // console.log(req.cookies.token);
  if (req.cookies.token) {
    const user = await User.findOne({
      token: req.cookies.token,
      deleted: false,
    });
    // console.log(user);
    if (user) {
      res.locals.user = user;
    }
  }

  next();
};
