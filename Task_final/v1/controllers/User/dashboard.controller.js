const Task = require("../../../models/task.model");
const Project = require("../../../models/project.model");

module.exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id; // lấy từ middleware auth

    // Tổng số task
    const totalTasks = await Task.countDocuments({
      deleted: false,
      createdBy: userId,
    });
    // Task pending
    const pendingTasks = await Task.countDocuments({
      status: "todo",
      deleted: false,
      createdBy: userId,
    });
    //Task in-progress
    const inProgressTasks = await Task.countDocuments({
      status: "in-progress",
      deleted: false,
      createdBy: userId,
    });
    // Task hoàn thành
    const doneTasks = await Task.countDocuments({
      status: "done",
      deleted: false,
      createdBy: userId,
    });
    //Task backlog
    const backlogTasks = await Task.countDocuments({
      status: "backlog",
      deleted: false,
      createdBy: userId,
    });

    // Productivity %
    const productivity =
      totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

    const chartData = {
      todo: pendingTasks,
      "in-progress": inProgressTasks,
      done: doneTasks,
      backlog: backlogTasks,
    };

    //Project.
    const totalTeamTasks = await Project.countDocuments({
      deleted: false,
      projectParentId: { $exists: true, $ne: null },
      assignee_id: { $exists: true, $ne: null, $ne: "" }, // Phải có assignee
      $or: [
        { assignee_id: userId },
        { listUser: userId.toString() },
        { createdBy: userId },
      ],
    });
    // Tổng số Project
    const totalProjects = await Project.countDocuments({
      deleted: false,
      projectParentId: { $exists: false },
      $or: [{ createdBy: userId }, { listUser: userId }],
    });
    // Projects pending
    const pendingProjetcs = await Project.countDocuments({
      status: "not-started",
      deleted: false,
      projectParentId: { $exists: false },
      $or: [{ createdBy: userId }, { listUser: userId }],
    });
    // project của team (task assign cho user hiện tại)
    const teamProjects = await Project.countDocuments({
      listUser: userId,
      deleted: false,
      projectParentId: { $exists: false },
    });
    // Project hoàn thành
    const doneProjects = await Project.countDocuments({
      status: "completed",
      deleted: false,
      projectParentId: { $exists: false },
      $or: [{ createdBy: userId }, { listUser: userId }],
    });
    // Productivity %
    const productivityProject =
      totalProjects === 0
        ? 0
        : Math.round((doneProjects / totalProjects) * 100);
    // Project distribution cho chart - ĐẾM RIÊNG TỪNG STATUS
    const notStartedProjects = await Project.countDocuments({
      status: "not-started",
      deleted: false,
      projectParentId: { $exists: false },
      $or: [{ createdBy: userId }, { listUser: userId }],
    });

    const inProgressProjects = await Project.countDocuments({
      status: "in-progress",
      deleted: false,
      projectParentId: { $exists: false },
      $or: [{ createdBy: userId }, { listUser: userId }],
    });

    const onHoldProjects = await Project.countDocuments({
      status: "on-hold",
      deleted: false,
      projectParentId: { $exists: false },
      $or: [{ createdBy: userId }, { listUser: userId }],
    });

    const completedProjects = await Project.countDocuments({
      status: "completed",
      deleted: false,
      projectParentId: { $exists: false },
      $or: [{ createdBy: userId }, { listUser: userId }],
    });

    const cancelledProjects = await Project.countDocuments({
      status: "cancelled",
      deleted: false,
      projectParentId: { $exists: false },
      $or: [{ createdBy: userId }, { listUser: userId }],
    });

    // Chart data 2 với 5 trạng thái
    const chartData2 = {
      "not-started": notStartedProjects,
      "in-progress": inProgressProjects,
      "on-hold": onHoldProjects,
      completed: completedProjects,
      cancelled: cancelledProjects,
    };

    // End Project
    return res.status(200).json({
      code: 200,
      tasks: {
        totalTasks: totalTasks,
        pendingTasks: pendingTasks,
        teamTasks: totalTeamTasks,
        productivity: productivity,
        chartData: chartData,
      },
      projects: {
        totalProjects,
        pendingProjetcs,
        teamProjects,
        productivityProject,
        chartData2,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: "Lỗi server",
    });
  }
};
