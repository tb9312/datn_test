const md5 = require("md5");
const rankingConfig = require("../../config/user.ranking.config");

const generateHelper = require("../../../helpers/generate");
const calculateSkillScore = require("../../../helpers/ranking/calculateSkillScore.helper");
const getCompletionRateByUsers = require("../../../helpers/ranking/getCompletionRateByUsers.helper");
const getBacklogByUsers = require("../../../helpers/ranking/getBacklogByUsers.helper");
// const sendMailHelper = require("../../helpers/send-mail");
const SKILL_SCORE_MAP = {
  beginner: 50,
  intermediate: 75,
  expert: 100,
};
const User = require("../../../models/user.model");
const ForgotPassword = require("../../../models/forgot-password.model");

//[POST] /api/v3/users/login
module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, deleted: false });
    if (!user) {
      return res.status(400).json({ message: "Email không tồn tại" });
    }

    if (md5(password) !== user.password) {
      return res.status(401).json({ message: "Sai mật khẩu" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: token,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

//[GET] /api/v1/users/detail
module.exports.detail = async (req, res) => {
  try {
    const token = req.cookies.token;

    console.log(token);

    // const user = await User.findOne({
    //   token: token,
    //   deleted: false,
    // }).select("-password -token");
    res.json({
      code: 200,
      message: "Thành công",
      info: req.user,
    });
  } catch (error) {
    res.json({
      code: 404,
      message: "Loi, hay dang nhap lai",
    });
  }
};
//[GET] /api/v3/users/logout
module.exports.logout = (req, res) => {
  try {
    // Xóa token trong cookie
    res.clearCookie("token");
    res.json({
      code: 200,
      message: "Đã đăng xuất",
    });
  } catch (error) {
    res.json({
      code: 404,
      message: "Vui long truy cap lai",
    });
  }
};

//[GET] /api/v3/users/listuser
module.exports.listuser = async (req, res) => {
  const users = await User.find({
    deleted: false,
  }).select("-password -token");
  res.json({
    code: 200,
    message: "Thành công",
    users: users,
  });
};
//[GET] /api/v3/users/listuser_hot
module.exports.listuserHot = async (req, res) => {
  try {
    // 1. (Optional) phân quyền
    if (req.user && req.user.role !== "MANAGER") {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    // 2. Lấy danh sách user
    const users = await User.find({ deleted: false, status: "active" }).lean();
    const userIds = users.map((u) => u._id);

    // 3. Lấy completion & backlog
    const completionMap = await getCompletionRateByUsers(userIds);
    const backlogMap = await getBacklogByUsers(userIds);

    // 4. Chấm điểm
    const rankedUsers = users.map((user) => {
      // console.log(user.skills);
      // Skill score từ STRING
      const skillScore = SKILL_SCORE_MAP[user.skills] || 0;

      const completionRate = completionMap[user._id.toString()]?.rate || 0;

      const backlogCount = backlogMap[user._id.toString()] || 0;

      const backlogPenalty = Math.min(
        backlogCount * rankingConfig.BACKLOG_PENALTY.PER_TASK,
        rankingConfig.BACKLOG_PENALTY.MAX
      );

      const finalScore =
        skillScore * rankingConfig.WEIGHT.SKILL +
        completionRate * rankingConfig.WEIGHT.COMPLETION -
        backlogPenalty;

      return {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        role: user.role,

        skills: user.skills,
        skillScore,

        completionRate: Math.round(completionRate),
        backlogCount,
        backlogPenalty,

        finalScore: Math.max(0, Math.round(finalScore)),
      };
    });

    // 5. Sắp xếp HOT → thấp
    rankedUsers.sort((a, b) => b.finalScore - a.finalScore);

    // 6. Response
    return res.json({
      success: true,
      criteria: {
        skill: "60%",
        completion: "40%",
        backlog: "penalty",
      },
      total: rankedUsers.length,
      data: rankedUsers,
    });
  } catch (error) {
    console.error("listuserHot error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};