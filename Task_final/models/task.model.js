const mongoose = require("mongoose");
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    content: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ["todo", "doing", "done"],
      default: "todo",
      index: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },

    thumbnail: String,

    timeStart: {
      type: Date,
      index: true,
    },

    timeFinish: {
      type: Date,
      index: true,
    },

    estimatedHours: {
      type: Number,
      default: 1,
      min: 0.25,
      max: 24,
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        index: true,
      },
    ],
    createdBy: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema, "tasks");

module.exports = Task;
