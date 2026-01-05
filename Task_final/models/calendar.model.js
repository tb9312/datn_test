const mongoose = require("mongoose");

const calendarSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    description: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: ["meeting", "task", "event", "reminder"],
      default: "event",
    },

    listUser: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],

    timeStart: {
      type: Date,
      required: true,
    },

    timeFinish: {
      type: Date,
      required: true,
    },

    location: {
      type: String,
      trim: true,
    },

    isAllDay: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
    },

    deleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index theo thời gian để query nhanh
calendarSchema.index({ timeStart: 1, timeFinish: 1 });

module.exports = mongoose.model("Calendar", calendarSchema, "calendars");