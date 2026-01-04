const systemConfig = require("../config/system");
const Account = require("../../models/account.model");
const Role = require("../../models/role.model");
module.exports.requireAuth = async (req, res, next) => {
  //   console.log(req.cookies.token);
  if (!req.cookies.token) {
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
  } else {
    const user = await Account.findOne({ token: req.cookies.token }).select(
      "-password"
    );
    // console.log(user);
    if (!user) {
      res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    } else {
      const role = await Role.findOne({
        _id: user.role_id,
      }).select("title permissions");
      res.locals.user = user;
      res.locals.role = role;

      next();
    }
  }
};
