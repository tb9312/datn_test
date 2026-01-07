const mongoose = require("mongoose");
const Chat = require("../../../models/chat.model");
const User = require("../../../models/user.model");

const chatSocket = require("../../Socket/chat.socket");
//[GET]/chat/
module.exports.index = async (req, res) => {
  //SocketIO
  chatSocket(res);
  //End SocketIO

  // Lấy data từ database
  const chats = await Chat.find({
    deleted: false,
  });
  for (const chat of chats) {
    const infoUser = await User.findOne({
      _id: chat.user_id,
    }).select("fullName");
    chat.infoUser = infoUser;
    // console.log(infoUser.fullName);
  }

  // console.log(chats);
  //Lấy hết database
  res.render("Client/pages/chat/index", {
    pageTitle: "Chat",
    chats: chats,
  });
};
module.exports.history = async (req, res) => {
  try {
    const { teamId } = req.query;
    if (!teamId) {
      return res
        .status(400)
        .json({ success: false, message: "teamId is required" });
    }

    // ✅ SỬA LẠI: Không dùng prefix "team_" vì trong database bạn lưu thẳng teamId
    // Dựa trên ảnh 0afdc0.png, room_key của bạn đang là: "694d7b25245946a57bfa505f"
    const roomKey = teamId;

    const chats = await Chat.find({
      deleted: false,
      room_key: roomKey,
    })
      .sort({ createdAt: 1 }) // Sắp xếp từ cũ đến mới
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