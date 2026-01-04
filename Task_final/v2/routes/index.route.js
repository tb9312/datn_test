const systemConfig = require("../config/system");
const authMiddleware = require("../middlewares/auth.middleware");
const settingMiddleware = require("../middlewares/setting.middleware");

const accountRoute = require("./account.route");
const roleRoute = require("./role.route");
const authRoute = require("./auth.route");
const dashboardRoute = require("./dashboard.route");
const usersRoute = require("./user.route");
const articleRoute = require("./article.route");
const settingRoutes = require("./setting.route");
const myAccountRoutes = require("./my-account.route");
module.exports = (app) => {
  const PATH_ADMIN = systemConfig.prefixAdmin;
  app.use(settingMiddleware.settingGeneral);

  app.use(
    PATH_ADMIN + "/dashboard",
    authMiddleware.requireAuth,
    dashboardRoute
  );
  app.use(
    PATH_ADMIN + "/my-account",
    authMiddleware.requireAuth,
    myAccountRoutes
  );

  app.use(PATH_ADMIN + "/accounts", authMiddleware.requireAuth, accountRoute);

  app.use(PATH_ADMIN + "/roles", authMiddleware.requireAuth, roleRoute);

  app.use(PATH_ADMIN + "/auth", authRoute);

  app.use(PATH_ADMIN + "/users", authMiddleware.requireAuth, usersRoute);

  app.use(PATH_ADMIN + "/articles", authMiddleware.requireAuth, articleRoute);

  app.use(PATH_ADMIN + "/settings", authMiddleware.requireAuth, settingRoutes);
};
