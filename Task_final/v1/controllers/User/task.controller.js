const Task = require("../../../models/task.model");
const PagitationHelper = require("../../../helpers/pagitation");
const SearchHelper = require("../../../helpers/search");
const Notification = require("../../../models/notification.model");

//[GET]/api/v1/tasks
module.exports.index = async (req, res) => {
  try {
    // console.log("Tasks index query:", req.query);
    const find = {
      deleted: false,
      createdBy: req.user.id,
    };

    // Filter by status
    if (req.query.status) {
      find.status = req.query.status;
    }

    // Search
    const keyword = (req.query.keyword || req.query.search || "")
      .toString()
      .trim();
    console.log("Search keyword received:", keyword);
    if (keyword) {
      const regex = new RegExp(keyword, "i");
      find.$or = [{ title: regex }, { content: regex }];
    }

    // Pagination (for list view)
    let initPagination = {
      limitItem: Number(req.query.limit) || 10,
      currentPage: Number(req.query.page) || 1,
    };
    const countTasks = await Task.countDocuments(find);
    const objectPagination = PagitationHelper(
      req.query,
      initPagination,
      countTasks
    );
    objectPagination.total = countTasks;
    const sort = { createdAt: -1 };
    if (req.query.sortKey && req.query.sortValue) {
      sort[req.query.sortKey] = req.query.sortValue;
    }

    if (req.query.forBoard === "true") {
      const allTasks = await Task.find(find)
        .sort(sort)
        .limit(initPagination.limitItem)
        .skip(objectPagination.skip);

      return res.json({
        code: 200,
        message: "success",
        data: allTasks,
        total: allTasks.length,
      });
    }

    // For list view: với phân trang
    const tasks = await Task.find(find)
      .sort(sort)
      .limit(objectPagination.limitItem)
      .skip(objectPagination.skip);

    res.json({
      code: 200,
      message: "success",
      data: tasks,
      pagination: objectPagination,
    });
  } catch (error) {
    console.error("Get tasks error:", error);
    res.json({
      code: 500,
      message: error.message || "Error getting tasks",
    });
  }
};
//[GET]/api/v1/tasks/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const userId = req.user._id;
    const id = req.params.id;
    const task = await Task.findOne({
      _id: id,
      deleted: false,
      createdBy: userId,
    });
    res.json(task);
  } catch (error) {
    res.json("Khong tim thay");
  }
};
//[PATCH] /api/v1/tasks/change-status/:id
module.exports.changeStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const status = req.body.status;
    await Task.updateOne(
      {
        _id: id,
      },
      {
        status: status,
      }
    );
    console.log(req.body);

    res.json({
      code: 200,
      message: "success",
    });
  } catch (error) {
    res.json({
      code: 404,
      message: "dismiss",
    });
  }
};

module.exports.changeMulti = async (req, res) => {
  try {
    const { ids, key, value } = req.body;
    console.log(ids);
    console.log(key);
    console.log(value);
    switch (key) {
      case "status":
        await Task.updateMany(
          {
            _id: { $in: ids },
            createdBy: req.user.id,
          },
          {
            status: value,
          }
        );
        res.json({
          code: 200,
          message: "success",
        });
        break;
      case "delete":
        await Task.updateMany(
          {
            _id: { $in: ids },
            createdBy: req.user.id,
          },
          {
            deleted: true,
            deletedAt: new Date(),
            deletedBy: req.user.id,
          }
        );
        res.json({
          code: 200,
          message: "success",
        });
        break;
      default:
        res.json({
          code: 404,
          message: "dismiss",
        });
        break;
    }
  } catch (error) {
    res.json({
      code: 404,
      message: "dismiss",
    });
  }
};

//[POST]/api/v1/tasks/create
module.exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(req.user.id);
    req.body.createdBy = userId;
    // 1. Validate required fields
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin bắt buộc",
      });
    }
    const task = new Task(req.body);
    const data = await task.save();
    // console.log(task);
    const notification = await Notification.create({
      user_id: userId,
      sender: userId,
      type: "CREATE_TASK",
      title: "Bạn được giao một task mới",
      message: `Task: ${data.title}`,
      url: `/tasks/detail/${data._id}`,
      priority: data.priority,
    });
    console.log(notification);
    res.json({
      code: 200,
      message: "success",
      data: data,
      // notification: notification,
    });
  } catch (error) {
    res.json({
      code: 404,
      message: "dismiss",
    });
  }
};

//[PATCH]/api/v1/tasks/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Update task with ID:", id);
    console.log("Update data:", req.body);

    const result = await Task.updateOne(
      { _id: id, createdBy: req.user.id },
      req.body
    );
    console.log("Update result:", result);

    if (result.matchedCount === 0) {
      res.json({
        code: 404,
        message: "Task not found",
      });
      return;
    }

    res.json({
      code: 200,
      message: "success",
    });
  } catch (error) {
    console.error("Edit task error:", error);
    res.json({
      code: 404,
      message: error.message || "dismiss",
    });
  }
};

//[PATCH]/api/v1/tasks/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Delete task - Task ID:", id);

    const result = await Task.updateOne(
      { _id: id, createdBy: req.user.id },
      {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.id,
      }
    );
    console.log("Delete result:", result);

    if (result.matchedCount === 0) {
      res.json({
        code: 404,
        message: "Task not found",
      });
      return;
    }

    res.json({
      code: 200,
      message: "success",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.json({
      code: 404,
      message: error.message || "dismiss",
    });
  }
};

//[PATCH]/api/v1/tasks/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Delete task - Task ID:", id);

    const result = await Task.updateOne(
      { _id: id, createdBy: req.user.id },
      {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.id,
      }
    );
    console.log("Delete result:", result);

    if (result.matchedCount === 0) {
      res.json({
        code: 404,
        message: "Task not found",
      });
      return;
    }

    res.json({
      code: 200,
      message: "success",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.json({
      code: 404,
      message: error.message || "dismiss",
    });
  }
};

// [GET] /api/v1/tasks/suggestSchedule
module.exports.suggestSchedule = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const tasks = await Task.find({
      createdBy: userId,
      deleted: false,
      status: { $ne: "done" },
    });

    const schedule = suggestSchedule(tasks);

    return res.json({
      success: true,
      totalTasks: tasks.length,
      schedule,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

//[PATCH]/api/v1/tasks/priority/:id
module.exports.changePriority = async (req, res) => {
  try {
    const id = req.params.id;
    const priority = req.body.priority;
    console.log("Change priority - Task ID:", id, "New priority:", priority);

    const result = await Task.updateOne(
      {
        _id: id,
        createdBy: req.user.id,
      },
      {
        priority: priority,
      }
    );
    console.log("Change priority result:", result);

    if (result.matchedCount === 0) {
      res.json({
        code: 404,
        message: "Task not found",
      });
      return;
    }

    res.json({
      code: 200,
      message: "success",
    });
  } catch (error) {
    console.error("Change priority error:", error);
    res.json({
      code: 404,
      message: error.message || "dismiss",
    });
  }
};
