const mongoose = require("mongoose");
const generate = require("../helpers/generate");

const forgotPasswordSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    otp: {
      type: String,
      required: true,
      minlength: 4,
      maxlength: 6,
    },

    expireAt: {
      type: Date,
      default: Date.now,
      expires: 180, // 3 phút
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
const ForgotPassword = mongoose.model(
  "ForgotPassword",
  forgotPasswordSchema,
  "forgot-password"
);

module.exports = ForgotPassword;
