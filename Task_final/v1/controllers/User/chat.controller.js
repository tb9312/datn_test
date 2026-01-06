const mongoose = require("mongoose");
const Chat = require("../../../models/chat.model");
const User = require("../../../models/user.model");

const chatSocket = require("../../Socket/chat.socket");
module.exports.history = async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) {
      return res
        .status(400)
        .json({ success: false, message: "teamId is required" });
    }

    const roomKey = `team_${teamId}`;

    const chats = await Chat.find({
      deleted: false,
      room_key: roomKey,
    })
      .sort({ createdAt: 1 })
      .lean();

    const userIds = [...new Set(chats.map((c) => String(c.user_id)))];
    const users = await User.find({ _id: { $in: userIds } })
      .select("fullName")
      .lean();

    const nameMap = new Map(users.map((u) => [String(u._id), u.fullName]));

    const data = chats.map((c) => ({
      _id: c._id,
      content: c.content,
      images: c.images || [],
      createdAt: c.createdAt,
      user_id: c.user_id,
      fullName: nameMap.get(String(c.user_id)) || "Unknown",
      room_key: c.room_key,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error("chat history error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};