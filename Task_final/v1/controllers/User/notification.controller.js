const Notification = require("../../../models/notification.model");
const PagitationHelper = require("../../../helpers/pagitation");
//[GET]/api/v1/notificatons/
module.exports.index = async (req, res) => {
  try {
    const userId = req.user.id;
    const find = {
      deleted: false,
      user_id: userId,
    };
    // Pagination (for list view)
    let initPagination = {
      limitItem: Number(req.query.limit) || 10,
      currentPage: Number(req.query.page) || 1,
    };
    const total = await Notification.countDocuments(find);

    const pagination = PagitationHelper(req.query, initPagination, total);
    const notifications = await Notification.find(find)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limitItem);
    console.log(notifications);
    res.json({
      code: 200,
      success: true,
      message: "Lấy danh sách thoong báo",
      data: notifications,
      total: notifications.length,
    });
  } catch (error) {
    console.error("LỖI ", error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

//[PATCH]/api/v1/notificatons/isreaded/:id
module.exports.isreaded = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    const result = await Notification.updateOne(
      {
        _id: id,
        deleted: false,
        user_id: userId,
      },
      {
        $set: { isRead: true },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        code: 404,
        success: false,
        message: "Không tìm thấy notification hoặc không có quyền",
      });
    }

    return res.json({
      code: 200,
      success: true,
      message: "Đã đánh dấu notification là đã đọc",
    });
  } catch (error) {
    console.error("LỖI :", error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};

//[PATCH]/api/v1/notificatons/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;

    const result = await Notification.updateOne(
      {
        _id: id,
        deleted: false,
        user_id: userId,
      },
      {
        $set: { deleted: true },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        code: 404,
        success: false,
        message: "Không tìm thấy notification hoặc không có quyền",
      });
    }

    return res.json({
      code: 200,
      success: true,
      message: "Đã xoá notification ",
    });
  } catch (error) {
    console.error("LỖI :", error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};
