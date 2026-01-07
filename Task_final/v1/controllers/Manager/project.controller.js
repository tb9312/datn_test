const Project = require("../../../models/project.model");
const Comment = require("../../../models/comment.model");
const PagitationHelper = require("../../../helpers/pagitation");
const SearchHelper = require("../../../helpers/search");
const User = require("../../../models/user.model");
const Team = require("../../../models/team.model");
const { updateOverdueProjetcs } = require("../../../helpers/updateOverdue");
const mongoose = require("mongoose");
//[GET]/api/v3/projects/:parentId/
module.exports.getTasksByParent = async (req, res) => {
  try {
    const parentId = req.params.parentId;

    // Kiểm tra project tồn tại
    const parentProject = await Project.findOne({
      _id: parentId,
      deleted: false,
    });

    if (!parentProject) {
      return res.status(404).json({
        code: 404,
        success: false,
        message: "Dự án không tồn tại",
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
      ); // THÊM select

    res.json({
      code: 200,
      success: true,
      message: "Lấy danh sách công việc thành công",
      data: tasks,
      total: tasks.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

//[GET]/api/v3/projects
module.exports.index = async (req, res) => {
  await updateOverdueProjetcs();
  const find = {
    $or: [
      { manager: req.user.id },
      { createdBy: req.user.id },
      { listUser: req.user.id },
    ],
    deleted: false,
    projectParentId: { $exists: false }, // CHỈ lấy dự án không có parent
  };
  if (req.query.status) {
    find.status = req.query.status;
  }
  //Search
  let objectSearch = SearchHelper(req.query);
  if (req.query.keyword) {
    find.title = objectSearch.regex;
  }
  //end search
  //Pagination
  let initPagination = {
    currentPage: 1,
    limitItem: 10,
  };
  const countProjects = await Project.countDocuments(find);
  const objectPagination = PagitationHelper(
    req.query,
    initPagination,
    countProjects
  );
  //End Pagination
  //sort
  // console.log(req.query);
  const sort = {};
  if (req.query.sortKey && req.query.sortValue) {
    sort[req.query.sortKey] = req.query.sortValue;
  }
  //end sort
  const projects = await Project.find(find)
    .sort(sort)
    .limit(objectPagination.limitItem)
    .skip(objectPagination.skip);

  res.json(projects);
};

//[GET]/api/v3/projects/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const id = req.params.id;

    // 1. Kiểm tra user có quyền xem project/task không
    const project = await Project.findOne({
      _id: id,
      deleted: false,
      $or: [
        { createdBy: req.user.id },
        { listUser: req.user.id },
        { manager: req.user.id },
      ],
    });

    if (!project) {
      return res.status(403).json({
        code: 403,
        success: false,
        message: "Bạn không có quyền xem dự án này",
      });
    }

    // 2. Tìm comments của project/task này
    const comments = await Comment.find({
      project: id,
      deleted: false,
    })
      .populate({
        path: "user",
        select: "fullName email avatar",
      })
      .sort({ position: 1, createdAt: 1 })
      .lean();

    res.json({
      code: 200,
      success: true,
      message: "Lấy chi tiết dự án thành công",
      data: project,
      comments: comments,
      totalComments: comments.length,
    });
  } catch (error) {
    console.error("ERROR in PROJECT DETAIL:", error);
    res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

//[POST]/api/v3/projects/create
module.exports.create = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const payload = {
      ...req.body,
      createdBy: req.user.id,
      manager: req.user.id,
    };

    const [project] = await Project.create([payload], { session });
    const listUser = Array.isArray(req.body.listUser)
      ? [...new Set([...req.body.listUser, req.user._id.toString()])]
      : [req.user._id.toString()];

    const [team] = await Team.create(
      [
        {
          project_id: project._id,
          name: project.title,
          leader: req.user._id,
          description: project.content,
          listUser,
          manager: project.manager,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return res.status(201).json({
      code: 200,
      message: "success",
      data: project,
      team: team,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);

    return res.status(500).json({
      code: 500,
      message: "CREATE_PROJECT_FAILED",
    });
  } finally {
    session.endSession();
  }
};

//[PATCH]/api/v3/projects/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id;
    // console.log(id);
    const data1 = await Project.findOne({
      _id: id,
      deleted: false,
    });
    // 1. Kiểm tra project tồn tại
    const existingProject = await Project.findOne({
      _id: id,
      deleted: false,
    });

    if (!existingProject) {
      console.log("Project not found");
      return res.json({
        code: 404,
        message: "Project not found or deleted",
      });
    }
    // 2. Kiểm tra quyền chỉnh sửa (chỉ người tạo được sửa)
    const createdUser = await User.findOne({
      _id: existingProject.createdBy,
    });

    if (!createdUser || createdUser._id.toString() !== req.user.id) {
      console.log("Permission denied - User is not the creator");
      return res.json({
        code: 200,
        message: "Bạn không phải người tạo dự án, nên không thể sửa",
      });
    }
    const updateResult = await Project.updateOne(
      { _id: id, deleted: false },
      { $set: req.body }
    );
    const updatedProject = await Project.findOne({
      _id: id,
      deleted: false,
    });
    res.json({
      code: 200,
      message: "Cập nhật thành công",
      data: updatedProject,
    });
  } catch (error) {
    console.error("Edit error:", error.message);
    res.json({
      code: 404,
      message: "dismiss" + error.message,
    });
  }
};

//[PATCH] /api/v3/projects/change-status/:id
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

//[PATCH]/api/v3/projects/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    const data = await Project.findOne({
      _id: id,
    });
    // console.log(data);
    // console.log(req.user.id);

    await Project.updateOne(
      { _id: id },
      {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: req.user.id,
      }
    );
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

//[POST]/api/v3/projects/comment/:id
module.exports.comment = async (req, res) => {
  try {
    const projectId = req.params.id;
    const userId = req.user.id;
    const commentContent = req.body.comment || req.body.content;
    // Check project/task
    const project = await Project.findOne({
      _id: projectId,
      deleted: false,
    });
    if (!project) {
      return res.status(404).json({
        code: 404,
        success: false,
        message: "Không tìm thấy dự án/công việc",
      });
    }
    // Check user is member
    const isCreator = project.createdBy.toString() === userId.toString();
    const isMember =
      project.listUser &&
      project.listUser.some((u) => u.toString() === userId.toString());
    if (!isCreator && !isMember) {
      return res.status(403).json({
        code: 403,
        success: false,
        message: "Bạn không có quyền bình luận",
      });
    }

    // Tạo comment
    const countComments = await Comment.countDocuments();
    // console.log("req.params.id:", req.params.id);
    // console.log("req.user.id:", req.user?.id);
    // console.log("req.body:", req.body.comment);
    const newComment = new Comment({
      project: projectId,
      user: userId,
      content: commentContent,
      position: countComments + 1,
    });
    const savedComment = await newComment.save();

    //Tra user info len frontend
    await savedComment.populate({
      path: "user",
      select: "fullName email avatar ",
    });
    return res.status(200).json({
      code: 200,
      success: true,
      message: "Bình luận thành công",
      data: savedComment,
    });
  } catch (error) {
    console.error("COMMENT ERROR:", error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

//[PATCH]/api/v3/projects/comment/edit/:id
module.exports.editComment = async (req, res) => {
  try {
    // console.log(req.params.id);

    const commentId = req.params.id;
    const userId = req.user.id;
    const newContent = req.body.comment || req.body.content;

    const comment = await Comment.findOne({
      _id: commentId,
      deleted: false,
    }).populate("user", "_id fullName");
    if (!comment) {
      return res.status(404).json({
        code: 404,
        success: false,
        message: "Không tìm thấy comment",
      });
    }
    // Kiểm tra quyền chỉnh sửa
    if (comment.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        code: 403,
        success: false,
        message: "Bạn không có quyền chỉnh sửa comment này",
      });
    }

    // Cập nhật nội dung comment
    comment.content = newContent;
    const updatedComment = await comment.save();
    return res.status(200).json({
      code: 200,
      success: true,
      message: "Chỉnh sửa comment thành công",
      data: updatedComment,
    });
  } catch (error) {
    console.error("EDIT COMMENT ERROR:", error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

//[PATCH]/api/v3/projects/comment/delete/:id
module.exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    const comment = await Comment.findOne({
      _id: commentId,
      deleted: false,
    }).populate("user", "_id fullName");

    if (!comment) {
      return res.status(404).json({
        code: 404,
        success: false,
        message: "Không tìm thấy comment",
      });
    }
    // Kiểm tra quyền xóa
    if (comment.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        code: 403,
        success: false,
        message: "Bạn không có quyền xóa comment này",
      });
    }
    // Xoá comment
    comment.deleted = true;
    comment.deletedAt = new Date();
    comment.deletedComment = await comment.save();
    return res.status(200).json({
      code: 200,
      success: true,
      message: "Xoá comment thành công",
      data: comment.deletedComment,
    });
  } catch (error) {
    console.error("DELETE COMMENT ERROR:", error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

//[PATCH]/api/v3/project/priority/:id
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
    // console.log(req.body);

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