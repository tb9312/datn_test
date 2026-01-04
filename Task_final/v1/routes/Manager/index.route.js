const projectRoute = require("./project.route");
const userRoute = require("./user.route");
const dashboardRoute = require("./dashboard.route");

const authMiddleware = require("../../middlewares/Manager/auth.middlewares");
const settingMiddleware = require("../../middlewares/Manager/setting.middleware");
module.exports = (app) => {
  const version = "/api/v3";
  app.use(settingMiddleware.settingGeneral);

  app.use(version + "/projects", authMiddleware.requireAuth, projectRoute);

  app.use(version + "/dashboard", authMiddleware.requireAuth, dashboardRoute);

  app.use(version + "/users", userRoute);
};
