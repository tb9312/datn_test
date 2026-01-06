const SettingGeneral = require("../../../models/settings-general.model");
// [GET] /api/v1/settings/general
module.exports.getGeneralSetting = async (req, res) => {
  try {
    const setting = await SettingGeneral.findOne({});
    // console.log(setting);
    res.json({
      success: true,
      data: setting,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};