const md5 = require("md5");
const Account = require("../../models/account.model");
const systemConfig = require("../config/system");

// [GET] /admin/my-account
module.exports.index = async (req, res) => {
  try {
    console.log(systemConfig.prefixAdmin);
    res.render("admin/pages/my-account/index", {
      pageTitle: "Thông tin cá nhân",
    });
  } catch (error) {
    req.flash("error", `Hành động xem lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  }
};

// [GET] /admin/my-account/edit
module.exports.edit = async (req, res) => {
  try {
    res.render("admin/pages/my-account/edit", {
      pageTitle: "Chỉnh sửa thông tin cá nhân",
    });
  } catch (error) {
    req.flash("error", `Hành động xem lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  }
};

// [PATCH] /admin/my-account/edit
module.exports.editPatch = async (req, res) => {
  try {
    const id = res.locals.user.id;

    const emailExist = await Account.findOne({
      _id: {
        $ne: id,
      },
      email: req.body.email,
      deleted: false,
    });

    if (emailExist) {
      req.flash("error", `Email ${req.body.email} đã tồn tại!`);
    } else {
      if (req.body.password) {
        req.body.password = md5(req.body.password);
      } else {
        delete req.body.password;
      }

      await Account.updateOne(
        {
          _id: id,
        },
        req.body
      );

      req.flash("success", "Cập nhật tài khoản thành công!");
    }

    res.redirect(`${systemConfig.prefixAdmin}/my-account`);
  } catch (error) {
    req.flash("error", `Hành động lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/my-account`);
  }
};
