const Project = require("../../models/project.model");

/**
 * Thống kê số công việc tồn đọng (trễ hạn & chưa done) theo user
 * @param {Array<ObjectId>} userIds
 * @returns {Object} { userId: backlogCount }
 */
async function getBacklogByUsers(userIds = []) {
  if (!Array.isArray(userIds) || userIds.length === 0) return {};

  const now = new Date();

  const stats = await Project.aggregate([
    {
      $match: {
        deleted: false,
        status: { $ne: "completed" },
        timeFinish: { $lt: now },
        listUser: { $in: userIds },
      },
    },
    { $unwind: "$listUser" },
    {
      $match: {
        listUser: { $in: userIds },
      },
    },
    {
      $group: {
        _id: "$listUser",
        backlogCount: { $sum: 1 },
      },
    },
  ]);

  const backlogMap = {};
  for (const item of stats) {
    backlogMap[item._id.toString()] = item.backlogCount;
  }

  return backlogMap;
}

module.exports = getBacklogByUsers;