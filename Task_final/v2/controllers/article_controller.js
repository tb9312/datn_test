const Article = require("../../models/article.model");
const Format = require("../../helpers/format");
const Account = require("../../models/account.model");
const PagitationHelper = require("../../helpers/pagitation");
const systemConfig = require("../config/system");
module.exports.index = async (req, res) => {
  try {
    let find = {
      deleted: false,
    };
    //Pagitation
    const countPosts = await Article.countDocuments(find);
    let objectPagitation = PagitationHelper(
      req.query,
      {
        limitItem: 3,
        currentPage: 1,
      },
      countPosts
    );
    //End Patitation
    const posts = await Article.find(find)
      .sort({ position: "desc" })
      .limit(objectPagitation.limitItem)
      .skip(objectPagitation.skip);
    for (const post of posts) {
      post.createdAtStr = Format.formatDate(post.createdAt);
      if (post.account_id != "none") {
        const account = await Account.findOne({ _id: post.account_id });
        post.creator = account.fullName;
      }
    }
    res.render("Admin/pages/article/index", {
      pageTitle: "Article",
      posts: posts,
      pagitation: objectPagitation,
    });
  } catch (error) {
    req.flash("error", `Hành động xem lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  }
};

module.exports.create = (req, res) => {
  try {
    res.render("Admin/pages/article/create", {
      pageTitle: "Create Post",
    });
  } catch (error) {
    req.flash("error", `Hành động xem lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/articles`);
  }
};
module.exports.createPost = async (req, res) => {
  try {
    const totalPost = await Article.countDocuments({});
    const { title, content } = req.body;
    const account_id = res.locals.user.id;
    const newArticle = new Article({
      account_id: account_id,
      title: title,
      content: content,
      position: totalPost + 1,
    });
    await newArticle.save();
    res.redirect(`${systemConfig.prefixAdmin}/articles`);
  } catch (error) {
    req.flash("error", `Hành động lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/articles`);
  }
};

module.exports.delete = async (req, res) => {
  try {
    const postId = req.params.id;
    await Article.updateOne({ _id: postId }, { deleted: true });
    res.redirect(`${systemConfig.prefixAdmin}/articles`);
  } catch (error) {
    req.flash("error", `Hành động lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/articles`);
  }
};

module.exports.edit = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Article.findOne({ _id: postId });
    // console.log(post);
    res.render("Admin/pages/article/edit", {
      pageTitle: "Edit Article",
      post: post,
    });
  } catch (error) {
    req.flash("error", `Hành động lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/articles`);
  }
};

module.exports.editPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { title, content } = req.body;
    await Article.updateOne(
      { _id: postId },
      { title: title, content: content }
    );
    res.redirect(`${systemConfig.prefixAdmin}/articles`);
  } catch (error) {
    req.flash("error", `Hành động lỗi`);
    res.redirect(`${systemConfig.prefixAdmin}/articles`);
  }
};
