module.exports.createPost = (req, res, next) => {
  // console.log(req.body);
  if (!req.body.fullName) {
    req.flash("error", `Vui long nhap tên`);
    res.redirect("back");
    return;
  }
  if (!req.body.email) {
    req.flash("error", `Vui long nhap email`);
    res.redirect("back");
    return;
  }
  if (!req.body.password) {
    req.flash("error", `Vui long nhap email`);
    res.redirect("back");
    return;
  }
  if (!req.body.role_id) {
    req.flash("error", `Vui long chon quyen`);
    res.redirect("back");
    return;
  }

  // console.log("ok");
  next();
};
module.exports.editPatch = (req, res, next) => {
  if (!req.body.fullName) {
    req.flash("error", `Vui long nhap tên`);
    res.redirect("back");
    return;
  }
  if (!req.body.email) {
    req.flash("error", `Vui long nhap email`);
    res.redirect("back");
    return;
  }
  next();
};
