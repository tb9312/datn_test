module.exports = (req, res, next) => {
  const userId = req.user._id.toString();
  const project = req.project;

  const isCreator = project.createdBy?.toString() === userId;

  const isManager = project.manager?.toString() === userId;

  if (!isCreator && !isManager) {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền chỉnh sửa dự án này",
    });
  }

  next();
};