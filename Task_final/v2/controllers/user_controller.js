const { query, application } = require("express");
const User = require("../../models/user.model");
const Account = require("../../models/account.model");
const filterStatusHelper = require("../../helpers/filterStatus");
const SearchHelper = require("../../helpers/search");
const PagitationHelper = require("../../helpers/pagitation");
const systemConfig = require("../config/system");
// [GET]/amdin/users
module.exports.index = async (req, res) => {
  try {
    /* ================= FILTER STATUS ================= */
    const filterStatus = filterStatusHelper.item(req.query);

    const find = {
      deleted: false,
    };

    if (req.query.status) {
      find.status = req.query.status;
    }

    /* ================= SEARCH ================= */
    const objectSearch = SearchHelper(req.query);
    if (objectSearch.regex) {
      find.fullName = objectSearch.regex;
    }

    /* ================= COUNT ================= */
    const countUsers = await User.countDocuments(find);

    /* ================= PAGINATION ================= */
    const objectPagitation = PagitationHelper(
      req.query,
      {
        limitItem: 5,
        currentPage: 1,
      },
      countUsers
    );

    /* ================= SORT ================= */
    const sort = {};
    if (req.query.sortKey && req.query.sortValue) {
      sort[req.query.sortKey] = req.query.sortValue;
    } else {
      sort.fullName = "asc";
    }

    /* ================= QUERY USERS ================= */
    const records = await User.find(find)
      .sort(sort)
      .limit(objectPagitation.limitItem)
      .skip(objectPagitation.skip)
      .select("-password -token");

    /* ================= UPDATED BY (SAFE) ================= */
    // Lấy danh sách account_id của người update cuối
    const accountIds = records
      .map((record) => record.updatedBy?.at(-1)?.account_id)
      .filter(Boolean);

    let accountMap = {};
    if (accountIds.length > 0) {
      const accounts = await Account.find({
        _id: { $in: accountIds },
      }).select("fullName");

      accounts.forEach((acc) => {
        accountMap[acc._id.toString()] = acc.fullName;
      });
    }

    // Gán accountFullName cho từng record
    records.forEach((record) => {
      const updatedBy = record.updatedBy?.at(-1);
      if (updatedBy) {
        updatedBy.accountFullName =
          accountMap[updatedBy.account_id?.toString()] || "";
      }
    });

    /* ================= RENDER ================= */
    res.render("Admin/pages/user/index.pug", {
      pageTitle: "Danh sách tài khoản người dùng",
      records,
      filterStatus,
      keyword: objectSearch.keyword,
      pagitation: objectPagitation,
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Lỗi users index");
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  }
};

// [PATCH]/admin/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
  try {
    // console.log(req.params);
    const status = req.params.status;
    const id = req.params.id;
    const updatedBy = {
      account_id: res.locals.user.id,
      updatedAt: new Date(),
    };
    await User.updateOne(
      { _id: id },
      { status: status, $push: { updatedBy: updatedBy } }
    );
    req.flash("success", "Cập nhật trạng thái thành công!");
    res.redirect(`${systemConfig.prefixAdmin}/users`);
  } catch (error) {
    req.flash("error", "Cập nhật trạng thái thất bại!");
    res.redirect(`${systemConfig.prefixAdmin}/users`);
  }
};
// [PATCH]/admin/products/change-role/:role/:id
module.exports.changeRole = async (req, res) => {
  try {
    // console.log(req.params);
    const role = req.params.role;
    const id = req.params.id;
    const updatedBy = {
      account_id: res.locals.user.id,
      updatedAt: new Date(),
    };
    await User.updateOne(
      { _id: id },
      { role: role, $push: { updatedBy: updatedBy } }
    );
    req.flash("success", "Cập nhật quyền thành công!");
    res.redirect(`${systemConfig.prefixAdmin}/users`);
  } catch (error) {
    req.flash("error", "Cập nhật quyền thất bại!");
    res.redirect(`${systemConfig.prefixAdmin}/users`);
  }
};
// [DELETE] /admin/users/delete;
module.exports.deleteItem = async (req, res) => {
  try {
    const id = req.params.id;
    // await Product.deleteOne({ _id: id });
    await User.updateOne(
      { _id: id },
      {
        deleted: true,
        deletedBy: {
          account_id: res.locals.user.id,
          deletedAt: new Date(),
        },
      }
    );
    req.flash("success", `Đã xóa tài khoản người dùng thành công!!!`);
    res.redirect("back");
  } catch (error) {
    req.flash("error", "Hành động xóa tài khoản người dùng thất bại!");
    res.redirect(`${systemConfig.prefixAdmin}/users`);
  }
};
// [GET] /admin/user/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const find = {
      deleted: false,
      _id: req.params.id,
    };
    const user = await User.findOne(find);
    res.render("Admin/pages/user/detail", {
      pageTitle: user.title,
      user: user,
    });
  } catch (error) {
    req.flash("error", `Loi `);
    res.redirect(`${systemConfig.prefixAdmin}/users`);
  }
};
