const mongoose = require("mongoose");

const settingGeneralSchema = new mongoose.Schema(
  {
    websiteName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    logo: {
      type: String,
      default: null,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },

    address: {
      type: String,
      trim: true,
      maxlength: 300,
    },

    copyright: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
const SettingGeneral = mongoose.model(
  "SettingGeneral",
  settingGeneralSchema,
  "settings-general"
);

module.exports = SettingGeneral;
