const mongoose = require("mongoose");
const PagitationHelper = require("../../../helpers/pagitation");
const SearchHelper = require("../../../helpers/search");
const Team = require("../../../models/team.model");
const Project = require("../../../models/project.model");
//[GET]/api/v1/teams
module.exports.index = async (req, res) => {
  try {
    const userId = req.user._id;
    const find = {
      deleted: false,
      $or: [{ manager: userId }, { leader: userId }, { listUser: userId }],
    };

    if (req.query.isActive !== undefined) {
      find.isActive = req.query.isActive === "true";
    }

    // SEARCH
    let objectSearch = SearchHelper(req.query);
    if (req.query.keyword) {
      find.name = objectSearch.regex;
    }

    // PAGINATION
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const total = await Team.countDocuments(find);

    // ===== SORT =====
    const sort = {};
    if (req.query.sortKey && req.query.sortValue) {
      sort[req.query.sortKey] = req.query.sortValue === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1;
    }

    // ===== QUERY =====
    const teams = await Team.find(find)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("leader", "fullName email")
      .populate("manager", "fullName email");

    return res.json({
      code: 200,
      data: teams,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("INDEX TEAM ERROR:", error);
    return res.status(500).json({
      code: 500,
      message: "GET_TEAMS_FAILED",
    });
  }
};
//[GET]/api/v1/teams/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user._id;

    const team = await Team.findOne({
      _id: id,
      deleted: false,
      $or: [{ manager: userId }, { leader: userId }, { listUser: userId }],
    });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Không có quyền truy cập hoặc team không tồn tại",
      });
    }

    return res.json({
      success: true,
      data: team,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//[POST]/api/v1/teams/create
module.exports.create = async (req, res) => {
  try {
    console.log(req.user.id);
    // Leader là người tạo
    req.body.leader = req.user.id;
    if (!req.body.project_id) {
      console.log("Bạn chưa chọn dự án");
      return res.status(403).json({
        code: 403,
        success: false,
        message:
          "Bạn không có quyền tạo nhóm mới. Chỉ được tạo nhóm từ dự án hiện có.",
      });
    }
    const project = await Project.findOne({
      _id: req.body.project_id,
      deleted: false,
    });
    if (!project) {
      console.log(" KHÔNG TÌM THẤY dự án :", req.body.project_id);
      return res.status(404).json({
        code: 404,
        success: false,
        message: "Không tìm thấy dự án",
      });
    }
    // Chỉ creator dự án mới được tạo team
    const isCreator = project.createdBy.toString() === req.user.id;
    if (!isCreator) {
      console.log(" USER không phải người tạo của dự án ");
      return res.status(403).json({
        code: 403,
        success: false,
        message:
          "Bạn không phải không phải người tạo của dự án. Không thể tạo nhóm.",
      });
    }
    // Không cho tạo team lần 2
    const teamtest = await Team.findOne({
      project_id: req.body.project_id,
      deleted: false,
    });
    if (teamtest) {
      console.log(" Nhóm đã được tạo, Bạn không tạo lần 2 ");
      return res.status(403).json({
        code: 403,
        success: false,
        message: "Nhóm đã được tạo, Bạn không tạo lần 2 ",
      });
    }

    // BUILD listUser
    let listUserRaw = [];
    if (Array.isArray(project.listUser)) {
      listUserRaw.push(...project.listUser);
    }
    if (Array.isArray(req.body.listUser)) {
      listUserRaw.push(...req.body.listUser);
    } else if (req.body.listUser) {
      listUserRaw.push(req.body.listUser);
    }
    listUserRaw.push(userId, project.manager);
    const listUser = [
      ...new Map(
        listUserRaw.filter(Boolean).map((id) => [id.toString(), id])
      ).values(),
    ];
    //create team
    const team = new Team({
      project_id: project._id,
      name: project.title,
      leader: userId,
      description: project.content,
      listUser,
      manager: project.manager,
    });
    await team.save();
    res.json({
      code: 200,
      message: "success",
      data: team,
    });
  } catch (error) {
    console.error(" LỖI KHI TẠO Teams:", error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

//[PATCH]/api/v1/teams/edit
module.exports.edit = async (req, res) => {
  try {
    // console.log(req.user._id);
    const userId = req.user._id.toString();
    const teamId = req.params.id;
    const team = await Team.findOne({
      _id: teamId,
      deleted: false,
    });
    if (!team) {
      return res.status(404).json({
        code: 404,
        message: "Không tìm thấy team",
      });
    }
    // Chỉ leader hoặc manager mới được sửa
    if (
      team.leader.toString() !== userId &&
      team.manager.toString() !== userId
    ) {
      return res.status(403).json({
        code: 403,
        message: "Bạn không có quyền sửa team",
      });
    }
    // Không cho sửa  leader, manager, _id
    const { leader, manager, _id, ...updateData } = req.body;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        code: 400,
        message: "Không có dữ liệu để cập nhật",
      });
    }
    const updatedTeam = await Team.findByIdAndUpdate(teamId, updateData, {
      new: true,
    });

    return res.json({
      code: 200,
      message: "Sửa team thành công",
      team: updatedTeam,
    });
  } catch (error) {
    console.error(" LỖI KHI SỬA Teams:", error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

//[PATCH]/api/v1/teams/delete/:id
module.exports.delete = async (req, res) => {
  try {
    console.log(req.user._id);
    const id = req.params.id;
    const team = await Team.findOne({
      _id: id,
      deleted: false,
    });
    if (!team) {
      return res.status(404).json({ message: "Không tìm thấy team" });
    }
    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền xoá team",
      });
    }
    if (team.leader.toString() == req.user._id.toString()) {
      await Team.updateOne(
        { _id: team._id },
        {
          deleted: true,
          deletedAt: new Date(),
          deletedBy: req.user._id,
        }
      );
      res.json({
        code: 200,
        message: "Xoá team thành công",
      });
    }
  } catch (error) {
    console.error(" LỖI KHI XOÁ Teams:", error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

//[PATCH]/api/v1/teams/isActive/:id
module.exports.isActive = async (req, res) => {
  try {
    console.log(req.user._id);
    const id = req.params.id;
    const isActive = req.body.isActive;
    const team = await Team.findOne({
      _id: id,
      deleted: false,
    });
    if (!team) {
      return res.status(404).json({ message: "Không tìm thấy team" });
    }
    if (
      team.leader.toString() !== req.user._id.toString() &&
      team.manager.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật team",
      });
    }
    await Team.updateOne(
      { _id: team._id },
      {
        isActive: isActive,
      }
    );
    res.json({
      code: 200,
      message: `Cập nhật trạng thái ${isActive} của  team thành công`,
    });
  } catch (error) {
    console.error(" LỖI KHI XOÁ Teams:", error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};
