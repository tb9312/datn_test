const Account = require("../../models/account.model");
const User = require("../../models/user.model");
// [GET]/amdin/dashboard
module.exports.index = async (req, res) => {
  const statistic = {
    account: {
      total: 0,
      active: 0,
      inactive: 0,
    },
    user: {
      total: 0,
      active: 0,
      inactive: 0,
    },
  };

  // Account
  statistic.account.total = await Account.countDocuments({
    deleted: false,
  });

  statistic.account.active = await Account.countDocuments({
    status: "active",
    deleted: false,
  });

  statistic.account.inactive = await Account.countDocuments({
    status: "inactive",
    deleted: false,
  });
  // End Account

  // User
  statistic.user.total = await User.countDocuments({
    deleted: false,
  });

  statistic.user.active = await User.countDocuments({
    status: "active",
    deleted: false,
  });

  statistic.user.inactive = await User.countDocuments({
    status: "inactive",
    deleted: false,
  });
  // End User

  res.render("Admin/pages/dashboard/index.pug", {
    pageTitle: "Dashboard",
    statistic: statistic,
  });
  // res.send("Trang tong quan");
};
