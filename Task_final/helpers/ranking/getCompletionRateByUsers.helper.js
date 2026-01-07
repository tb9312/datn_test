const Project = require("../../models/project.model");

/**
 * Tính tỷ lệ hoàn thành công việc theo user
 * @param {Array<ObjectId>} userIds
 * @returns {Object} { userId: { total, done, rate } }
 */
async function getCompletionRateByUsers(userIds = []) {
  if (!Array.isArray(userIds) || userIds.length === 0) return {};
  const stats = await Project.aggregate([
    {
      $match: {
        deleted: false,
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
        total: { $sum: 1 },
        done: {
          $sum: {
            $cond: [{ $in: ["$status", ["done", "completed"]] }, 1, 0],
          },
        },
      },
    },
  ]);
  console.log(stats);
  const resultMap = {};
  for (const item of stats) {
    resultMap[item._id.toString()] = {
      total: item.total,
      done: item.done,
      rate: item.total ? (item.done / item.total) * 100 : 0,
    };
  }

  return resultMap;
}

module.exports = getCompletionRateByUsers;