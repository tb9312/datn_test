const Project = require("../../../models/project.model");
const Comment = require("../../../models/comment.model");
const PagitationHelper = require("../../../helpers/pagitation");
const SearchHelper = require("../../../helpers/search");
const User = require("../../../models/user.model");
const Team = require("../../../models/team.model");
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
  const find = {
    $or: [
      { manager: req.user.id },
      { createdBy: req.user.id },
      // { listUser: req.user.id },
    ],
    deleted: false,
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
    const findcomment = {
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
        data: newComment,
      });
    } else {
      res.json({
        code: 200,
        message: "Khong lay ra duoc du lieu",
      });
    }
  } catch (error) {
    s;
    res.json({
      code: 404,
      message: "dismiss",
    });
  }
};

//[PATCH]/api/v3/projects/comment/edit/:id
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
