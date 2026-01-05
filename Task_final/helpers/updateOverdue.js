const Task = require("../models/task.model");
const Project = require("../models/project.model");
const Notification = require("../models/notification.model");

module.exports.updateOverdueTasks = async () => {
  const now = new Date();

  // 1. Lấy các task sẽ bị overdue
  const overdueTasks = await Task.find({
    deleted: false,
    status: { $in: ["todo"] },
    timeFinish: { $exists: true, $lt: now },
  }).select("_id title createdBy priority");

  if (!overdueTasks.length) return 0;
  // 2. Update status
  const taskIds = overdueTasks.map((t) => t._id);

  await Task.updateMany(
    { _id: { $in: taskIds } },
    { $set: { status: "backlog" } }
  );
  // 3. Tạo notification
  const notifications = overdueTasks.map((task) => ({
    user_id: task.createdBy,
    sender: task.createdBy,
    type: "TASK",
    title: "Task bị tồn đọng",
    message: `Task "${task.title}" đã quá hạn`,
    url: `/tasks/detail/${task._id}`,
    priority: task.priority,
  }));

  await Notification.insertMany(notifications);
  return overdueTasks.length;
};

module.exports.updateOverdueProjetcs = async () => {
  const now = new Date();

  // 1. Lấy các task sẽ bị overdue
  const overdueProject = await Project.find({
    deleted: false,
    status: { $in: ["not-started"] },
    timeFinish: { $exists: true, $lt: now },
  }).select("_id title createdBy priority");

  if (!overdueProject.length) return 0;
  // 2. Update status
  const projectIds = overdueProject.map((t) => t._id);

  await Project.updateMany(
    { _id: { $in: projectIds } },
    { $set: { status: "on-hold" } }
  );

  // 3. Tạo notification
  const notifications = overdueProject.map((project) => ({
    user_id: project.createdBy,
    sender: project.createdBy,
    type: "PROJECT",
    title: "Projects bị tồn đọng",
    message: `Projects "${project.title}" đã quá hạn`,
    url: `/projects/detail/${project._id}`,
    priority: project.priority,
  }));

  await Notification.insertMany(notifications);
  return overdueTasks.length;
};