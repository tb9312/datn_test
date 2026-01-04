const Project = require("../../../models/project.model");
const Comment = require("../../../models/comment.model");
const PagitationHelper = require("../../../helpers/pagitation");
const SearchHelper = require("../../../helpers/search");
const User = require("../../../models/user.model");
const Team = require("../../../models/team.model");
const Notification = require("../../../models/notification.model");
//[GET]/api/v3/projects/:parentId/tasks
module.exports.getTasksByParent = async (req, res) => {
  try {
    const parentId = req.params.parentId;
    // console.log("=== USER GET TASKS BY PARENT ===");
    // console.log("Parent ID:", parentId);
    // console.log("User ID:", req.user?.id);

    // Kiểm tra user có quyền xem tasks của project này không
    const parentProject = await Project.findOne({
      _id: parentId,
      deleted: false,
      $or: [{ createdBy: req.user.id }, { listUser: req.user.id }],
    });

    if (!parentProject) {
      console.log(" User không có quyền xem tasks của project này");
      return res.status(403).json({
        code: 403,
        success: false,
        message: "Bạn không có quyền xem công việc của dự án này",
      });
    }

    const find = {
      projectParentId: parentId,
      deleted: false,
    };

    // Filter theo status nếu có
    if (req.query.status) {
      find.status = req.query.status;
    }

    // Filter theo priority nếu có
    if (req.query.priority) {
      find.priority = req.query.priority;
    }

    // Search trong tasks
    if (req.query.keyword) {
      const objectSearch = SearchHelper(req.query);
      find.title = objectSearch.regex;
    }

    // Sort
    const sort = {};
    if (req.query.sortKey && req.query.sortValue) {
      sort[req.query.sortKey] = req.query.sortValue;
    } else {
      sort.createdAt = -1;
    }

    const tasks = await Project.find(find)
      .sort(sort)
      .select(
        "_id title content status priority timeStart timeFinish createdBy listUser assignee_id tag estimatedHours"
      ); // ⚠️ THÊM select
    console.log(`Found ${tasks.length} tasks for parent ${parentId}`);

    res.json({
      code: 200,
      success: true,
      message: "Lấy danh sách công việc thành công",
      data: tasks,
      total: tasks.length,
    });
  } catch (error) {
    console.error("ERROR in GET TASKS BY PARENT:", error);
    res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

//[GET]/api/v1/projects
module.exports.index = async (req, res) => {
  try {
    // CHỈ LẤY DỰ ÁN CHA - KHÔNG LẤY TASK
    const find = {
      $or: [{ createdBy: req.user.id }, { listUser: req.user.id }],
      deleted: false,
      projectParentId: { $exists: false }, // CHỈ lấy dự án không có parent
    };

    if (req.query.status) {
      find.status = req.query.status;
    }

    if (req.query.tag) {
      find.tag = req.query.tag;
    }

    // Search
    let objectSearch = SearchHelper(req.query);
    if (req.query.keyword) {
      find.title = objectSearch.regex;
    }

    // Pagination
    let initPagination = {
      currentPage: 1,
      limitItem: 2,
    };

    const countProjects = await Project.countDocuments(find);

    const objectPagination = PagitationHelper(
      req.query,
      initPagination,
      countProjects
    );

    // Sort
    const sort = {};
    if (req.query.sortKey && req.query.sortValue) {
      sort[req.query.sortKey] = req.query.sortValue;
    } else {
      sort.createdAt = -1;
    }

    const projects = await Project.find(find)
      .sort(sort)
      .limit(objectPagination.limitItem)
      .skip(objectPagination.skip);

    // Debug log
    projects.forEach((p, i) => {
      console.log(
        `  ${i + 1}. ${p.title} - ParentID: ${p.projectParentId || "None"}`
      );
    });

    res.json(projects);
  } catch (error) {
    console.error("ERROR in USER GET PROJECTS:", error);
    res.status(500).json({
      code: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

//[GET]/api/v1/projects/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const id = req.params.id;
    const findcomment = {
      $or: [{ createdBy: req.user.id }, { listUser: req.user.id }],
      deleted: false,
      project_id: id,
    };
    const comment = await Comment.find(findcomment);
    // console.log(comment);
    const project = await Project.findOne({
      _id: id,
      deleted: false,
    });
    res.json({
      code: 200,
      message: "success",
      data: project,
      comment: comment,
    });
  } catch (error) {
    res.json("Khong tim thay");
  }
};

//[POST]/api/v1/projects/create
module.exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    req.body.createdBy = req.user.id;

    // USER CHỈ ĐƯỢC TẠO TASK (có projectParentId)
    if (!req.body.projectParentId) {
      console.log("USER không được tạo dự án cha (parent project)");
      return res.status(403).json({
        code: 403,
        success: false,
        message:
          "Bạn không có quyền tạo dự án mới. Chỉ được tạo công việc trong dự án hiện có.",
      });
    }

    console.log(" USER đang tạo TASK với parentId:", req.body.projectParentId);

    // 3. Tìm dự án cha
    const parentProject = await Project.findOne({
      _id: req.body.projectParentId,
      deleted: false,
    });

    if (!parentProject) {
      console.log(" KHÔNG TÌM THẤY dự án cha:", req.body.projectParentId);
      return res.status(404).json({
        code: 404,
        success: false,
        message: "Không tìm thấy dự án cha",
      });
    }

    console.log(" Tìm thấy dự án cha:", parentProject.title);

    // KIỂM TRA: User có phải là thành viên của dự án cha
    const isCreator = parentProject.createdBy.toString() === req.user.id;
    const isMember =
      parentProject.listUser &&
      parentProject.listUser.some(
        (userId) => userId.toString() === req.user.id
      );

    if (!isCreator && !isMember) {
      console.log(" USER không phải thành viên của dự án cha");
      return res.status(403).json({
        code: 403,
        success: false,
        message:
          "Bạn không phải thành viên của dự án này. Không thể tạo công việc.",
      });
    }

    // console.log(" User có quyền tạo task trong dự án này");

    // 5. Gán manager từ dự án cha
    req.body.manager = parentProject.manager || parentProject.createdBy;

    // 6. Đảm bảo listUser là array hợp lệ
    if (!req.body.listUser || !Array.isArray(req.body.listUser)) {
      req.body.listUser = [];
    }

    // 7. Đảm bảo assignee_id là người tạo (nếu không có)
    if (!req.body.assignee_id) {
      req.body.assignee_id = req.user.id;
    }

    // TẠO TASK
    const newTask = new Project(req.body);
    const savedTask = await newTask.save();
    const uniqueListUser = [
      ...new Set([
        ...(Array.isArray(req.body.listUser)
          ? req.body.listUser
          : req.body.listUser
          ? [req.body.listUser]
          : []),
        req.user._id.toString(),
        newTask.manager,
      ]),
    ];
    // Tạo team theo task

    const team = new Team({
      project_id: newTask._id,
      name: newTask.title,
      leader: req.user._id,
      description: newTask.content,
      listUser: uniqueListUser,
      manager: newTask.manager,
    });

    await team.save();
    // tạo thông báo
    const usersToNotify = uniqueListUser.filter(
      (uid) => uid.toString() !== userId.toString()
    ); // array userId
    const notifications = usersToNotify.map((uid) => ({
      user_id: uid,
      sender: userId,
      type: "CREATE_PROJECT",
      title: "Bạn được tham gia vào dự án mới",
      message: `Project: ${savedTask.title}`,
      url: `/projects/detail/${savedTask._id}`,
      priority: savedTask.priority,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
    return res.status(200).json({
      code: 200,
      success: true,
      message: "Tạo công việc thành công",
      data: savedTask,
      team: team,
    });
  } catch (error) {
    console.error(" LỖI KHI TẠO TASK:", error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

//[PATCH]/api/v1/projects/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user._id;

    const project = await Project.findOne({
      _id: projectId,
      deleted: false,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dự án",
      });
    }

    if (project.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không phải người tạo dự án",
      });
    }

    await Project.updateOne({ _id: projectId }, req.body);

    const updatedProject = await Project.findById(projectId);

    // Tạo Thông báo
    // lấy danh sách user nhận thông báo
    const uniqueListUser = [
      ...(updatedProject.listUser || []),
      updatedProject.manager,
    ].filter(Boolean);

    const usersToNotify = uniqueListUser.filter(
      (uid) => uid.toString() !== userId.toString()
    );

    const notifications = usersToNotify.map((uid) => ({
      user_id: uid,
      sender: userId,
      type: "PROJECT",
      title: "Dự án vừa được cập nhật",
      message: `Project: ${updatedProject.title}`,
      url: `/projects/${updatedProject._id}`,
      priority: updatedProject.priority || "MEDIUM",
    }));

    if (notifications.length) {
      await Notification.insertMany(notifications);
    }

    return res.json({
      success: true,
      message: "Cập nhật dự án thành công",
      data: updatedProject,
    });
  } catch (error) {
    console.error("EDIT PROJECT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//[PATCH] /api/v1/projects/change-status/:id
module.exports.changeStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const status = req.body.status;
    const data = await Project.findOne({
      _id: id,
      deleted: false,
    });
    await Project.updateOne(
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
      data: data,
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
        await Project.updateMany(
          {
            _id: { $in: ids },
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

//[PATCH]/api/v1/projects/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;

    const project = await Project.findOne({
      _id: projectId,
      deleted: false,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dự án",
      });
    }

    if (project.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Bạn không phải người tạo dự án",
      });
    }

    await Project.updateOne(
      { _id: projectId },
      {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      }
    );

    // lấy user nhận thông báo (trước khi xoá)
    const uniqueListUser = [
      ...(project.listUser || []),
      project.manager,
    ].filter(Boolean);

    const usersToNotify = uniqueListUser.filter(
      (uid) => uid.toString() !== userId.toString()
    );

    const notifications = usersToNotify.map((uid) => ({
      user_id: uid,
      sender: userId,
      type: "PROJECT",
      title: "Dự án bạn tham gia đã bị xoá",
      message: `Project: ${project.title}`,
      url: `/projects/${project._id}`,
      priority: project.priority || "MEDIUM",
    }));

    if (notifications.length) {
      await Notification.insertMany(notifications);
    }

    return res.json({
      success: true,
      message: "Xoá dự án thành công",
    });
  } catch (error) {
    console.error("DELETE PROJECT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//[PATCH]/api/v1/tasks/priority/:id
module.exports.changePriority = async (req, res) => {
  try {
    const id = req.params.id;
    const priority = req.body.priority;
    await Project.updateOne(
      {
        _id: id,
      },
      {
        priority: priority,
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

//[POST]/api/v1/projects/comment/:id
module.exports.comment = async (req, res) => {
  try {
    const countComments = (await Comment.countDocuments()) + 1;
    // console.log("req.params.id:", req.params.id);
    // console.log("req.user.id:", req.user?.id);
    // console.log("req.body:", req.body.comment);
    const newComment = new Comment({
      project_id: req.params.id,
      user_id: req.user.id,
      userName: req.user.fullName,
      comment: req.body.comment,
      position: countComments,
    });
    const data = await newComment.save();
    console.log(newComment);
    if (newComment) {
      res.json({
        code: 200,
        message: "success",
        data: data,
      });
    } else {
      res.json({
        code: 200,
        message: "Khong lay ra duoc du lieu",
      });
    }
  } catch (error) {
    res.json({
      code: 404,
      message: "dismiss",
    });
  }
};

//[PATCH]/api/v1/projects/comment/edit/:id
module.exports.editComment = async (req, res) => {
  try {
    // console.log(req.params.id);
    const id = req.params.id;
    const comment = await Comment.findOne({
      _id: id,
      deleted: false,
      user_id: req.user.id,
    });
    if (comment) {
      await Comment.updateOne(
        {
          _id: id,
        },
        {
          comment: req.body.comment,
        }
      );
      const data = await Comment.findOne({
        _id: id,
        deleted: false,
      });
      res.json({
        code: 200,
        message: "đã chỉnh sửa comment",
        data: data,
      });
    } else {
      res.json({
        code: 400,
        message: "Ban khong duoc sua comment cua nguoi khac",
      });
    }
  } catch (error) {
    res.json({
      code: 404,
      message: "dismiss",
    });
  }
};

//[PATCH]/api/v1/projects/comment/delete/:id
module.exports.deleteComment = async (req, res) => {
  try {
    // console.log(req.params.id);
    const id = req.params.id;
    const comment = await Comment.findOne({
      _id: id,
      deleted: false,
      user_id: req.user.id,
    });
    if (comment) {
      await Comment.updateOne(
        {
          _id: id,
        },
        {
          deleted: true,
        }
      );
      const data = await Comment.findOne({
        _id: id,
        deleted: false,
      });
      res.json({
        code: 200,
        message: "đã xoá comment",
        data: data,
      });
    } else {
      res.json({
        code: 400,
        message: "Ban khong duoc xoá comment cua nguoi khac",
      });
    }
  } catch (error) {
    res.json({
      code: 404,
      message: "dismiss",
    });
  }
};
