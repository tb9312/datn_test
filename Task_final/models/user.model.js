const mongoose = require("mongoose");
const generate = require("../helpers/generate");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      // select: false, // KHÔNG trả về khi query
    },

    token: {
      type: String,
      // select: false,
    },
    role: {
      type: String,
      enum: ["MANAGER", "USER"],
      default: "USER",
      index: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
    },
    status: {
      type: String,
      default: "active",
    },
    // requestFriends: Array, // Lời mời đã gửi
    // acceptFriends: Array, // Lời mời đã nhận
    // friendList: [
    //   // danh sách bạn bè
    //   {
    //     user_id: String,
    //     room_chat_id: String,
    //   },
    // ],
    workingHoursPerDay: {
      type: Number,
      default: 8,
      min: 1,
      max: 24,
    },
    statusOnline: String,
    deletedBy: {
      account_id: String,
      deletedAt: Date,
    },
    updatedBy: [
      {
        account_id: String,
        updatedAt: Date,
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema, "users");

module.exports = User;
