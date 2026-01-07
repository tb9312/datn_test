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
      enum: ["backlog", "in-progress", "todo", "done"],
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
    createdBy: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);
taskSchema.index({
  createdBy: 1,
  deleted: 1,
  status: 1,
  createdAt: -1,
});

// Cho overdue job
taskSchema.index({
  status: 1,
  timeFinish: 1,
  deleted: 1,
});

const Task = mongoose.model("Task", taskSchema, "tasks");

module.exports = Task;