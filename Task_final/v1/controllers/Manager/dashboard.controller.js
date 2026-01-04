const Project = require("../../../models/project.model");

module.exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id; // lấy từ middleware auth

    //Project.
    // Tổng số Project
    // Tổng số Project
    const totalProjects = await Project.countDocuments({
      deleted: false,
      projectParentId: { $exists: false },
      $or: [{ createdBy: userId }, { listUser: userId.toString() }],
    });
    // Tổng số PM
    const totalPM = await Project.countDocuments({
      deleted: false,
      projectParentId: { $exists: false },
      createdBy: userId,
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
      listUser: userId.toString(),
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

    console.log("📊 Projects distribution:", chartData2);
    // End Project
    return res.status(200).json({
      code: 200,
      projects: {
        totalProjects,
        totalPM,
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
