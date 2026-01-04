module.exports.createPost = (req, res, next) => {
  // console.log(req.body);
  if (!req.body.title) {
    req.flash("error", `Vui long nhap tieu de`);
    res.redirect("back");
    return;
  }
  next();
};
