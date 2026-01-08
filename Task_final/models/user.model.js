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
    position_job: String,
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
    // THÊM vào userSchema (sau field "role"):
    skills: {
      type: String,
      enum: ["beginner", "intermediate", "expert"],
      default: "intermediate",
    },

    // THÊM để cache workload (tính toán sau):
    currentTaskCount: {
      type: Number,
      default: 0,
      min: 0,
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
