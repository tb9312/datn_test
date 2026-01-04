const md5 = require("md5");

const generateHelper = require("../../../helpers/generate");
// const sendMailHelper = require("../../helpers/send-mail");

const User = require("../../../models/user.model");
const ForgotPassword = require("../../../models/forgot-password.model");

//[POST] /api/v3/users/login
module.exports.login = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const user = await User.findOne({
      email: email,
      deleted: false,
      role: "MANAGER",
    });
    if (!user) {
      res.json({
        code: 400,
        message: "Dang nhap khong thanh cong",
      });
      return;
    }
    // console(email);
    // console(password);
    if (md5(password) !== user.password) {
      res.json({
        code: 404,
        message: "sai mat khau",
      });
      return;
    }
    const userInfo = {
      _id: user._id, // ← ID THẬT TỪ DATABASE
      fullName: user.fullName,
      email: user.email,
      role: user.role || "MANAGER",
    };
    const token = user.token;
    res.cookie("token", token);
    res.json({
      code: 200,
      message: "Dang nhap thanh cong",
      token: token,
      user: userInfo,
    });
  } catch (error) {
    res.json({
      code: 404,
      message: "Dang nhap khong thanh cong",
    });
  }
};

//[GET] /api/v1/users/detail
module.exports.detail = async (req, res) => {
  try {
    const token = req.cookies.token;

    console.log(token);

    // const user = await User.findOne({
    //   token: token,
    //   deleted: false,
    // }).select("-password -token");
    res.json({
      code: 200,
      message: "Thành công",
      info: req.user,
    });
  } catch (error) {
    res.json({
      code: 404,
      message: "Loi, hay dang nhap lai",
    });
  }
};
//[GET] /api/v3/users/logout
module.exports.logout = (req, res) => {
  try {
    // Xóa token trong cookie
    res.clearCookie("token");
    res.json({
      code: 200,
      message: "Đã đăng xuất",
    });
  } catch (error) {
    res.json({
      code: 404,
      message: "Vui long truy cap lai",
    });
  }
};

//[GET] /api/v3/users/listuser
module.exports.listuser = async (req, res) => {
  const users = await User.find({
    deleted: false,
  }).select("-password -token");
  res.json({
    code: 200,
    message: "Thành công",
    users: users,
  });
};
