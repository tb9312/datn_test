const { query, application } = require("express");
const Role = require("../../models/role.model");
const Account = require("../../models/account.model");
const systemConfig = require("../config/system");
// [GET]/amdin/roles
module.exports.index = async (req, res) => {
  try {
    let find = {
      deleted: false,
    };
    const records = await Role.find(find);
    res.render("Admin/pages/roles/index.pug", {
      pageTitle: "Danh sách nhóm quyền",
      records: records,
    });
  } catch (error) {
    req.flash("error", `Hành động xem lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  }
};
//[GET]/amdin/roles/create
module.exports.create = async (req, res) => {
  try {
    res.render("Admin/pages/roles/create.pug", {
      pageTitle: "Tạo mới danh sách nhóm quyền",
    });
  } catch (error) {
    req.flash("error", `Hành động xem lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/roles`);
  }
};
//[POST]/amdin/roles/ceate
module.exports.createPost = async (req, res) => {
  try {
    // console.log(req.body);
    const record = new Role(req.body);
    await record.save();
    req.flash("success", "Tạo mới quyền thành công!!!");
    res.redirect(`${systemConfig.prefixAdmin}/roles`);
  } catch (error) {
    req.flash("error", `Hành động create role lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/roles`);
  }
};

// [DELETE] /admin/roles/Delete;
module.exports.deleteItem = async (req, res) => {
  try {
    const id = req.params.id;
    // await Product.deleteOne({ _id: id });
    await Role.updateOne({ _id: id }, { deleted: true, deletedAt: new Date() });
    req.flash("success", `Xóa sản phẩm thành công!!!`);
    res.redirect(`${systemConfig.prefixAdmin}/roles`);
  } catch (error) {
    req.flash("error", `Hành động delete role lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/roles`);
  }
};

//[GET] admin/roles/edit
module.exports.edit = async (req, res) => {
  try {
    const find = {
      deleted: false,
      _id: req.params.id,
    };
    const role = await Role.findOne(find);
    res.render("Admin/pages/roles/edit.pug", {
      pageTitle: "Chinh sua quyen",
      roles: role,
    });
  } catch (error) {
    req.flash("error", `Nhóm quyền này không tồn tại`);
    res.redirect(`${systemConfig.prefixAdmin}/roles`);
  }
};

// [PATCH] /admin/roles/edit/:id
module.exports.editPatch = async (req, res) => {
  console.log(req.body);
  // console.log("OK");
  const id = req.params.id;
  try {
    // console.log(id);
    await Role.updateOne(
      {
        _id: id,
      },
      req.body
    );

    req.flash("success", "Cập nhật nhóm quyền thành công!");
  } catch (error) {
    req.flash("error", "Cập nhật nhóm quyền thất bại!");
  }

  res.redirect(`${systemConfig.prefixAdmin}/roles`);
};

//[GET] admin/roles/detail
module.exports.detail = async (req, res) => {
  try {
    const find = {
      deleted: false,
      _id: req.params.id,
    };
    const role = await Role.findOne(find);
    res.render("Admin/pages/roles/detail", {
      pageTitle: role.title,
      role: role,
    });
  } catch (error) {
    req.flash("error", `Nhóm quyền này không tồn tại`);
    res.redirect(`${systemConfig.prefixAdmin}/roles`);
  }
};

//[GET] admin/roles/permission
module.exports.permissions = async (req, res) => {
  try {
    let find = {
      deleted: false,
    };
    const records = await Role.find(find);
    res.render("Admin/pages/roles/permissions", {
      pageTitle: "Nhóm quyền",
      records: records,
    });
  } catch (error) {
    req.flash("error", `Hành động xem permission lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/roles`);
  }
};

//[PATCH] admin/roles/permission
module.exports.permissionsPatch = async (req, res) => {
  try {
    // console.log(req.body);
    const permissions = JSON.parse(req.body.permissions);
    // console.log(permissions);
    // res.send("OK");
    for (const item of permissions) {
      await Role.updateOne(
        { _id: item.id },
        {
          permissions: item.permissions,
        }
      );
    }
    req.flash("success", "Cập nhật phân quyền thành công!");
  } catch (error) {
    req.flash("error", "Cập nhật phân quyền thất bại!");
  }
  res.redirect(`${systemConfig.prefixAdmin}/roles/permissions`);
};
