const { query, application } = require("express");
const md5 = require("md5");

const Account = require("../../models/account.model");
const systemConfig = require("../config/system");

//[GET] /admin/auth/login
module.exports.login = (req, res) => {
  // console.log(req.cookies.token);
  if (req.cookies.token) {
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  } else {
    res.render("Admin/pages/auth/login.pug", {
      pageTitle: "Login",
    });
  }
};
//[POST] /admin/auth/login
module.exports.loginPost = async (req, res) => {
  // console.log(req.body);
  const email = req.body.email;
  const password = req.body.password;
  console.log(req.body.email);
  console.log(req.body.password);
  const user = await Account.findOne({
    email: email,
    deleted: false,
  });
  // console.log(user);
  if (!user) {
    req.flash("error", "Không tồn tại tài khoản !!!");
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    return;
  }
  if (md5(password) != user.password) {
    req.flash("error", "Sai mật khẩu !!!");
    res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    return;
  }
  // if (user.status != "active") {
  //   req.flash("error", "Tài khoản đã bị khóa !!!");
  //   res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
  //   return;
  // }
  res.cookie("token", user.token);
  res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
};

module.exports.logout = (req, res) => {
  // Xóa token trong cookie
  res.clearCookie("token");
  res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
};
//
