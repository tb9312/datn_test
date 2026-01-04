module.exports.loginPost = (req, res, next) => {
  if (!req.body.email) {
    res.json({
      code: 400,
      message: "Dismiss: Vui lòng nhập email!!",
    });
    return;
  }
  if (!req.body.password) {
    res.json({
      code: 400,
      message: "Dismiss: Vui lòng nhập passwork!!!",
    });
    return;
  }
  next();
};
