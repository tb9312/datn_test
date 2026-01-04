const { query, application } = require("express");
const md5 = require("md5");
const Account = require("../../models/account.model");
const Role = require("../../models/role.model");
const systemConfig = require("../config/system");
// [GET]/amdin/accounts
module.exports.index = async (req, res) => {
  try {
    // console.log("ok");
    let find = {
      deleted: false,
    };
    const records = await Account.find(find).select("-password -token");
    // console.log(records);
    for (const record of records) {
      const role = await Role.findOne({
        _id: record.role_id,
        // deleted: false,
      });
      if (!role.deleted) {
        record.role = role;
      }
      // console.log(record.role);
    }
    res.render("Admin/pages/accounts/index.pug", {
      pageTitle: "Danh sách tài khoản",
      records: records,
    });
    // res.send("Trang tong quan");
  } catch (error) {
    req.flash("error", `Hành động thất bại`);
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  }
};
// [PATCH]/admin/products/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
  try {
    // console.log(req.params);
    const status = req.params.status;
    const id = req.params.id;
    await Account.updateOne({ _id: id }, { status: status });
    req.flash("success", "Cập nhật trạng thái thành công!");
    res.redirect("back");
  } catch (error) {
    req.flash("error", `tài khoản không tồn tại`);
    res.redirect(`${systemConfig.prefixAdmin}/accounts`);
  }
};
//[GET] admin/accounts/create
module.exports.create = async (req, res) => {
  try {
    const roles = await Role.find({ deleted: false });
    let find = {
      deleted: false,
    };
    const records = await Account.find(find);

    res.render("Admin/pages/accounts/create", {
      pageTitle: "Thêm mới sản phẩm",
      records: records,
      roles: roles,
    });
  } catch (error) {
    req.flash("error", `lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/accounts`);
  }
};

//[POST] admin/accounts/create
module.exports.createPost = async (req, res) => {
  // console.log(req.body);
  try {
    const emailExist = await Account.findOne({
      email: req.body.email,
      deleted: false,
    });
    // console.log(emailExist);
    if (emailExist) {
      req.flash("error", "Email da ton tai");
      res.redirect("back");
    } else {
      req.body.password = md5(req.body.password);
      const record = new Account(req.body);
      await record.save();
      req.flash("success", "Tạo mới tài khoản thành công!!!");
      res.redirect(`${systemConfig.prefixAdmin}/accounts`);
    }
  } catch (error) {
    req.flash("error", `tài khoản không tồn tại`);
    res.redirect(`${systemConfig.prefixAdmin}/accounts`);
  }
};

//[GET] admin/accounts/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await Account.findOne({
      _id: id,
      deleted: false,
    });
    const roles = await Role.find({
      deleted: false,
    });
    res.render("Admin/pages/accounts/edit", {
      pageTitle: "Chỉnh sửa tài khoản",
      data: data,
      roles: roles,
    });
  } catch (error) {
    req.flash("error", `Tài khoản không tồn tại`);
    res.redirect(`${systemConfig.prefixAdmin}/accounts`);
  }
};

//[PATCH] admin/accounts/edit/:id
module.exports.editPatch = async (req, res) => {
  const id = req.params.id;
  try {
    const emailExist = await Account.findOne({
      _id: { $ne: id },
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
      // console.log(req.body);
      await Account.updateOne(
        {
          _id: id,
        },
        req.body
      );

      req.flash("success", "Cập nhật tài khoản thành công!");
    }

    res.redirect("back");
  } catch (error) {
    req.flash("error", `tài khoản không cập nhập thành công`);
    res.redirect(`back`);
  }
};

module.exports.deleteItem = async (req, res) => {
  try {
    const id = req.params.id;
    await Account.updateOne(
      {
        _id: id,
      },
      {
        deleted: true,
      }
    );

    req.flash("success", `Đã xoá thành công!`);

    res.redirect("back");
  } catch (error) {
    req.flash("error", `tài khoản không cập nhập thành công`);
    res.redirect(`back`);
  }
};

// [GET] /admin/Account/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const find = {
      deleted: false,
      _id: req.params.id,
    };
    const account = await Account.findOne(find);
    const role = await Role.findOne({
      _id: account.role_id,
      deleted: false,
    });
    res.render("Admin/pages/accounts/detail", {
      pageTitle: account.title,
      account: account,
      role: role,
    });
  } catch (error) {
    req.flash("error", `Loi `);
    res.redirect(`${systemConfig.prefixAdmin}/accounts`);
  }
};
