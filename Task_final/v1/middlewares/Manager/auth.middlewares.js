const User = require("../../../models/user.model");
module.exports.requireAuth = async (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    // console.log(token);
    const user = await User.findOne({
      token: token,
      deleted: false,
      role: "MANAGER",
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
