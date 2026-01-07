const jwt = require("jsonwebtoken");
const User = require("../../../models/user.model");

module.exports.requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    let token = null;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
      //console.log("token", token);
    }
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET); // nhớ set JWT_SECRET
    } catch (e) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired token" });
    }
    const user = await User.findById(decoded.id).select("-password");
    if (!user || user.status == "inactive") {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }
    req.user = user;
    req.auth = decoded;
    return next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};