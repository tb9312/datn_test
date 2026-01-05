const mongoose = require("mongoose");
const projectSchema = new mongoose.Schema(
  {
    title: String,
    status: String,
    content: String,
    priority: String,
    thumbnail: String,
    timeStart: Date,
    timeFinish: Date,
    createdBy: String,
    deletedBy: String,
    listUser: Array,
    projectParentId: String,
    tags: String,
    manager: String,
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  { timestamps: true }
);
projectSchema.index({
  createdBy: 1,
  deleted: 1,
  status: 1,
  createdAt: -1,
});

// Cho overdue job
projectSchema.index({
  status: 1,
  timeFinish: 1,
  deleted: 1,
});
const Project = mongoose.model("Project", projectSchema, "projects");

module.exports = Project;