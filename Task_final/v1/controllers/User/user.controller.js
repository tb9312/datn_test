const md5 = require("md5");

const generateHelper = require("../../../helpers/generate");
const sendMailHelper = require("../../../helpers/send-mail");

const User = require("../../../models/user.model");
const ForgotPassword = require("../../../models/forgot-password.model");

//[POST] /api/v1/users/register
module.exports.register = async (req, res) => {
  // console.log(req.body);
  req.body.password = md5(req.body.password);
  // console.log(req.body);
  const existEmail = await User.findOne({
    email: req.body.email,
    deleted: false,
  });
  // console.log(existEmail);
  if (existEmail) {
    res.json({
      code: 400,
      message: "Email đã tồn tại!",
    });
  } else {
    const user = new User({
      fullName: req.body.fullName,
      email: req.body.email,
      password: req.body.password,
      token: generateHelper.generateRandomString(30),
    });
    user.save();
    const token = user.token;
    res.cookie("token", token);
    res.json({
      code: 200,
      message: "Tao tai khoan thanh cong",
      token: token,
    });
  }
};

//[POST] /api/v1/users/login
module.exports.login = async (req, res) => {
  // console.log(req.body);
  const email = req.body.email;
  const password = req.body.password;
  const user = await User.findOne({
    email: email,
    deleted: false,
  });
  if (!user) {
    res.json({
      code: 400,
      message: "Dang nhap khong thanh cong",
    });
    return;
  }
  // console(email);
  console.log(md5(password));
  console.log(user);
  if (md5(password) !== user.password) {
    res.json({
      code: 404,
      message: "sai mat khau",
    });
    return;
  }
  const userInfo = {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role || "user",
  };
  const token = user.token;
  res.cookie("token", token);
  res.json({
    code: 200,
    message: "Dang nhap thanh cong",
    token: token,
    user: userInfo,
  });
};
//[POST]/api/v1/users/password/forgot
module.exports.forgotPassword = async (req, res) => {
  console.log("ok");
  const email = req.body.email;
  const user = await User.findOne({
    email: email,
    deleted: false,
  });
  if (!user) {
    res.json({
      code: 400,
      message: "Email khong ton tai!!!",
    });
    return;
  }
  //Luu thong tin vao DB
  const otp = generateHelper.generateRandomNumber(8);

  // const timeExpire = 5;

  const objectForgotPassword = {
    email: email,
    otp: otp,
    expireAt: Date.now(),
  };
  console.log(objectForgotPassword);

  const forgotPassword = new ForgotPassword(objectForgotPassword);
  await forgotPassword.save();

  //Neu ton tai thi gui ma OTP qua email
  const subject = "Mã OTP xác minh lấy lại mật khẩu";
  const html = `Mã OTP lấy lại mật khẩu là :<b>${otp}</b>. Thời hạn sử dụng là 3 phút. Hế, đại đại nha bà`;

  sendMailHelper.sendMail(email, subject, html);
  res.json({
    code: 200,
    message: "Đã gửi mã OTP qua email !!!",
  });

  // res.redirect(`/user/password/otp?email=${email}`);
};

//[POST] /api/v1/users/password/otp
module.exports.otpPassword = async (req, res) => {
  const email = req.body.email;
  const otp = req.body.otp;

  // console.log(email);
  // console.log(otp);
  const result = await ForgotPassword.findOne({
    email: email,
    otp: otp,
  });
  if (!result) {
    res.json({
      code: 400,
      message: "OTP khong hop le",
    });
    return;
  }
  const user = await User.findOne({
    email: email,
  });
  const token = user.token;
  res.cookie("token", token);

  res.json({
    code: 200,
    message: "Xác thực thành công!!!",
    token: token,
  });
};

module.exports.resetPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
      res.json({
        code: 400,
        message: "Email và mật khẩu là bắt buộc!",
      });
      return;
    }

    const user = await User.findOne({
      email: email,
      deleted: false,
    });

    if (!user) {
      res.json({
        code: 400,
        message: "Người dùng không tồn tại!",
      });
      return;
    }

    // Kiểm tra mật khẩu mới có khác mật khẩu cũ không
    if (md5(password) === user.password) {
      res.json({
        code: 400,
        message: "Vui lòng nhập mật khẩu mới khác mật khẩu cũ!!!",
      });
      return;
    }

    // Cập nhật mật khẩu
    await User.updateOne({ email: email }, { password: md5(password) });

    res.json({
      code: 200,
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.json({
      code: 500,
      message: "Lỗi đặt lại mật khẩu",
    });
  }
};
//[GET] /api/v1/users/detail
module.exports.detail = async (req, res) => {
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

// [PATCH] /user/edit
module.exports.editPatch = async (req, res) => {
  const id = req.user.id;
  try {
    const emailExist = await User.findOne({
      _id: {
        $ne: id,
      },
      email: req.body.email,
      deleted: false,
    });

    if (emailExist) {
      res.json({
        code: 500,
        message: "Email da ton tai",
      });
    } else {
      if (req.body.password) {
        req.body.password = md5(req.body.password);
      } else {
        delete req.body.password;
      }

      const users = await User.updateOne(
        {
          _id: id,
        },
        req.body
      );

      res.json({
        code: 200,
        message: "Thành công",
        users: users,
      });
    }
  } catch (error) {
    res.json({
      code: 400,
      message: "Dismiss",
    });
  }
};
