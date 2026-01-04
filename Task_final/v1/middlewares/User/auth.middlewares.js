const User = require("../../../models/user.model");
module.exports.requireAuth = async (req, res, next) => {
  // if (!req.cookies.token) {
  //   res.redirect(`/user/login`);
  //   return;
  // }

  // const user = await User.findOne({
  //   token: req.cookies.token,
  // }).select("-password");

  // if (!user) {
  //   res.redirect(`api/v1/user/login`);
  //   return;
  // }
  // req.user = user;
  // next();
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    // console.log(token);
    const user = await User.findOne({
      token: token,
      deleted: false,
    }).select("-password -token");
    if (!user) {
      res.json({
        code: 400,
        message: "Tai khoan khong hop le!!",
      });
      return;
    }
    req.user = user;
    next();
  } else {
    res.json({
      code: 400,
      mesage: "Vui long gui kem token",
    });
  }
};
