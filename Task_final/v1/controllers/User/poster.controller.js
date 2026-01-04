const Poster = require("../../../models/article.model");
//[GET]/api/v1/poster.
module.exports.index = async (req, res) => {
  try {
    // Lấy 1 bài post có position cao nhất (poster)
    const poster = await Poster.findOne({ deleted: false })
      .sort({ position: -1 })
      .lean();

    if (!poster) {
      return res.status(404).json({
        code: 404,
        success: false,
        message: "Không tìm thấy poster",
      });
    }

    poster.createdAtStr = Format.formatDate(poster.createdAt);

    return res.json({
      code: 200,
      message: "success",
      poster,
    });
  } catch (error) {
    console.error("LỖI KHI LẤY POSTER:", error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi server: " + error.message,
    });
  }
};
