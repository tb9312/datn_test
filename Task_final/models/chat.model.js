const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    room_chat_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      index: true,
    },

    content: {
      type: String,
      trim: true,
      default: "",
    },

    images: [
      {
        type: String,
        trim: true,
      },
    ],

    messageType: {
      type: String,
      enum: ["text", "image", "mixed"],
      default: "text",
      index: true,
    },

    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Chat = mongoose.model("Chat", chatSchema, "chats");

module.exports = Chat;
