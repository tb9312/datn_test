const taskRoute = require("./task.route");
const userRoute = require("./user.route");
const projectRoute = require("./project.route");
const diaryRoute = require("./user.route");
const userSocialRoutes = require("./social.route");
const chatRoutes = require("./chat.route");
const dashboardRoute = require("./dashboard.route");
const teamRoute = require("./team.route");
const postRoute = require("./post.route");
const notificationRoute = require("./notification.route");

const authMiddleware = require("../../middlewares/User/auth.middlewares");
const settingMiddleware = require("../../middlewares/User/setting.middleware");
module.exports = (app) => {
  const version = "/api/v1";
  app.use(settingMiddleware.settingGeneral);
  app.use(version + "/tasks", authMiddleware.requireAuth, taskRoute);

  app.use(version + "/poster", authMiddleware.requireAuth, postRoute);

  app.use(
    version + "/notifications",
    authMiddleware.requireAuth,
    notificationRoute
  );

  app.use(version + "/dashboard", authMiddleware.requireAuth, dashboardRoute);

  app.use(version + "/projects", authMiddleware.requireAuth, projectRoute);

  app.use(version + "/diarys", authMiddleware.requireAuth, diaryRoute);

  app.use(version + "/chat", authMiddleware.requireAuth, chatRoutes);

  app.use(version + "/teams", authMiddleware.requireAuth, teamRoute);

  app.use(version + "/users", userRoute);
};
