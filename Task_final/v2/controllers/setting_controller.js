const { query, application } = require("express");
const SettingGeneral = require("../../models/settings-general.model");
const systemConfig = require("../config/system");
// [GET]/amdin/settings/general
module.exports.general = async (req, res) => {
  const settingGeneral = await SettingGeneral.findOne({});
  res.render("Admin/pages/settings/general", {
    pageTitle: "Cài đặt chung",
    settingGeneral: settingGeneral,
  });
};
// [PATCH]/amdin/settings/general
module.exports.generalPatch = async (req, res) => {
  try {
    const settingGeneral = await SettingGeneral.findOne({});

    if (settingGeneral) {
      await SettingGeneral.updateOne(
        {
          _id: settingGeneral.id,
        },
        req.body
      );
    } else {
      const record = new SettingGeneral(req.body);
      await record.save();
    }

    req.flash("success", "Cập nhật thành công!!!");

    res.redirect(`${systemConfig.prefixAdmin}/settings/general`);
  } catch (error) {
    req.flash("error", `Hành động update_setting lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  }
};
